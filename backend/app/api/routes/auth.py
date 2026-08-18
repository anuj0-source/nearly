from fastapi import APIRouter,Cookie
from schemas.credential import GoogleCredential
from app.core.session import sessions

router=APIRouter(
    prefix="/api/auth"
)

@router.post("/google")
async def oauth(credential:GoogleCredential,session_id:str | None = Cookie(default=None)):
    if session_id in sessions:

    else:
        