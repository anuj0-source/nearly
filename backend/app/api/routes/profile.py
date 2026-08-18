from fastapi import APIRouter,Response,Cookie,HTTPException
from schemas.users import UserEdit
from core.session import sessions

router=APIRouter(
    prefix="/api/profile"
)

@router.patch("")
async def update_profile(data:UserEdit,session_id:str | None = Cookie(default=None)):
    if not session_id or session_id not in sessions:
        raise HTTPException(
            status_code=401,
            detail="Anonymous session not found"
        )
    else:
        user=sessions[session_id]

        if data.name is not None:
            user.name = data.name

        if data.avatar is not None:
            user.avatar = data.avatar

        if data.interests is not None:
            for interest in data.interests:
                user.interests.append(interest)

        if data.language is not None:
            user.language = data.language

        if data.gender is not None:
            user.gender=data.gender

        return user
