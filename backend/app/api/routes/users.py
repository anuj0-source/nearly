from fastapi import APIRouter
from pydantic import BaseModel
import uuid
import random

router=APIRouter(
    prefix="/api/users",
    tags=["Users"]
)

class UserResponse(BaseModel):
    name:str
    user_id:str
    avatar:str

names = [
    "Anonymous Fox",
    "Anonymous Panda",
    "Anonymous Owl",
    "Anonymous Tiger",
    "Anonymous Bear",
    "Anonymous Ghost"
]

avatars = ["🦊", "🐼", "🦉", "🐯", "🐻", "👻"]

@router.post("/session",response_model=UserResponse)
async def create_session():
    user_id=str(uuid.uuid4())
    index = random.randrange(len(names))

    name=names[index]

    return UserResponse(
        user_id=user_id,
        name=name,
        avatar=avatars[index]
    )