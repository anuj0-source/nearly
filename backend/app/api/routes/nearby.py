from fastapi import APIRouter,HTTPException,Cookie
from schemas.location import LocationUpdate

router=APIRouter(
    prefix="/api/nearby"
)

# @router.post("/location")
# async def update_location(data:LocationUpdate,session_id:str | None = Cookie(default=None)):
#     if session_id is None:
#         raise HTTPException(
#             status_code=401,
#             detail="anonymous session not found"
#         )
#     else:
#         user=sessions[session_id]

#         user.latitude=data.latitude
#         user.longitude=data.longitude

#         return {"message":"location updated"}