from fastapi import APIRouter,Cookie,HTTPException,Depends,UploadFile,File
from schemas.users import UserEdit
from database import get_db
from sqlalchemy.orm import Session
from models.user import AnonymousSession
from sqlalchemy import select, func
from services.cloudinary_service import upload_image,delete_image
import random

router=APIRouter(
    prefix="/api/profile"
)

@router.post("/edit-profile")
async def edit_profile(
    edit_body : UserEdit,
    session_id : str | None = Cookie(default=None),
    db : Session = Depends(get_db)
):
    
    if not session_id:
        raise HTTPException(
            status_code=404,
            details="session not found"
        )
    
    user = db.scalar(select(AnonymousSession).where(AnonymousSession.session_id == session_id))
    
    if not user:
        raise HTTPException(
            status_code=404,
            details="user not found"
        )
    
    if edit_body.name:
        user.name = edit_body.name
    
    if edit_body.language:
        user.language = edit_body.language
    
    if edit_body.gender:
        user.gender = edit_body.gender
    
    db.commit()
    db.refresh(user)

    lon, lat = None, None
    if user.location is not None:
        lon, lat = db.execute(select(func.ST_X(user.location), func.ST_Y(user.location))).first()

    return {
        "session_id":user.session_id,
        "name":user.name,
        "avatar":user.avatar,
        "language":user.language,
        "gender":user.gender,
        "latitude":lat,
        "longitude":lon,
        "created_at":user.created_at
    }

ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp"
}

@router.patch("/upload-avatar")
async def change_avatar(
    file: UploadFile = File(...),
    session_id : str | None = Cookie(default=None),
    db : Session = Depends(get_db)
):

    if not session_id:
        raise HTTPException(
            status_code=404,
            details="session not found"
        )
    
    user = db.scalar(select(AnonymousSession).where(AnonymousSession.session_id == session_id))
    
    if not user:
        raise HTTPException(
            status_code=404,
            details="user not found"
        )
    
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            details="invalid file type"
        )

    previous_avatar_url=user.avatar

    if previous_avatar_url and "res.cloudinary.com" in previous_avatar_url and "nearly/avatars" in previous_avatar_url:
        file_part = previous_avatar_url.split("nearly/avatars/")[-1]
        file_name = file_part.rsplit(".", 1)[0]
        public_id = f"nearly/avatars/{file_name}"
        await delete_image(public_id)
    
    result = await upload_image(file.file,"nearly/avatars")

    user.avatar = result["url"]
    db.commit()
    db.refresh(user)

    lon, lat = None, None
    if user.location is not None:
        lon, lat = db.execute(select(func.ST_X(user.location), func.ST_Y(user.location))).first()

    return {
        "session_id":user.session_id,
        "name":user.name,
        "avatar":user.avatar,
        "language":user.language,
        "gender":user.gender,
        "latitude":lat,
        "longitude":lon,
        "created_at":user.created_at
    }

@router.patch("/remove-avatar")
async def remove_avatar(
    session_id:str | None = Cookie(default=None),
    db:Session = Depends(get_db)
):

    if not session_id:
        raise HTTPException(
            status_code=404,
            details="session not found"
        )
    
    user = db.scalar(select(AnonymousSession).where(AnonymousSession.session_id == session_id))
    
    if not user:
        raise HTTPException(
            status_code=404,
            details="user not found"
        )
    
    previous_avatar_url=user.avatar

    if previous_avatar_url and "res.cloudinary.com" in previous_avatar_url and "nearly/avatars" in previous_avatar_url:
        file_part = previous_avatar_url.split("nearly/avatars/")[-1]
        file_name = file_part.rsplit(".", 1)[0]
        public_id = f"nearly/avatars/{file_name}"
        await delete_image(public_id)
    
    seed = random.randint(1, 1000000)

    avatar=f"https://api.dicebear.com/9.x/notionists/svg?seed={seed}&backgroundColor=ff3366,20b2aa,00bfff,9370db,ff7f50,3cb371,1e90ff,ff1493,00fa9a,ffa500,8a2be2,ff4500,adff2f,00ced1"

    user.avatar = avatar
    db.commit()
    db.refresh(user)

    lon, lat = None, None
    if user.location is not None:
        lon, lat = db.execute(select(func.ST_X(user.location), func.ST_Y(user.location))).first()

    return {
        "session_id":user.session_id,
        "name":user.name,
        "avatar":user.avatar,
        "language":user.language,
        "gender":user.gender,
        "latitude":lat,
        "longitude":lon,
        "created_at":user.created_at
    }