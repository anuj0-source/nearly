from fastapi import APIRouter,Cookie,HTTPException
from schemas.users import UserEdit

router=APIRouter(
    prefix="/api/profile"
)

# @router.patch("")
# async def update_profile(data:UserEdit,session_id:str | None = Cookie(default=None)):
#     if not session_id or session_id not in sessions:
#         raise HTTPException(
#             status_code=401,
#             detail="Anonymous session not found"
#         )
#     else:
#         user=sessions[session_id]

#         if data.name is not None:
#             user.name = data.name

#         if data.avatar is not None:
#             user.avatar = data.avatar

#         if data.language is not None:
#             user.language = data.language

#         if data.gender is not None:
#             user.gender=data.gender

#         return user
