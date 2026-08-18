from fastapi import APIRouter,Response,Cookie
import uuid
import random

from core.session import sessions,AnonymousUser

router=APIRouter(
    prefix="/api/session",
    tags=["Session"]
)

names = [
    "Anonymous Fox",
    "Anonymous Panda",
    "Anonymous Owl",
    "Anonymous Tiger",
    "Anonymous Bear",
    "Anonymous Ghost"
]

avatars = ["🦊", "🐼", "🦉", "🐯", "🐻", "👻"]

@router.post("/anonymous")
async def create_anonymous_session(response:Response,session_id:str | None = Cookie(default=None)):
    if session_id in sessions:
        return {**sessions[session_id].model_dump(),"new_session":False}

    else:
        new_session_id=str(uuid.uuid4())
        index=random.randrange(len(names))

        user=AnonymousUser(
            name=names[index],
            avatar=avatars[index],
            session_id=new_session_id
        )

        sessions[new_session_id]=user

        response.set_cookie(
            key="session_id",
            value=new_session_id,
            httponly=True,
            samesite="lax",
            max_age=60 * 60 * 24 * 7
        )

        return {
            "session_id":new_session_id,
            "name":names[index],
            "avatar":avatars[index],
            "new_session":True
        }

@router.get("/me")
async def get_me(response:Response,session_id:str | None = Cookie(default=None)):
    if session_id not in sessions:
        return await create_anonymous_session(response)
    else:
        return sessions[session_id]