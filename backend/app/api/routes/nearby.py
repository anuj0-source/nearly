from fastapi import APIRouter, HTTPException, Cookie, Depends
from schemas.location import LocationUpdate
from database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import select
from models.user import AnonymousSession
from math import radians, sin, cos, asin, sqrt

router = APIRouter(prefix="/api/nearby")


# ── GET /api/nearby/status ────────────────────────────────────────────────────
@router.get("/status")
async def get_nearby_status(
    session_id: str | None = Cookie(default=None),
    db: Session = Depends(get_db)
):
    if session_id is None:
        raise HTTPException(status_code=401, detail="anonymous session not found")

    user = db.scalar(
        select(AnonymousSession).where(AnonymousSession.session_id == session_id)
    )

    if user is None:
        raise HTTPException(status_code=404, detail="session not found in database")

    return {"is_nearby_enabled": user.is_nearby_enabled}


# ── POST /api/nearby/location ─────────────────────────────────────────────────
@router.post("/location")
async def update_location(
    data: LocationUpdate,
    session_id: str | None = Cookie(default=None),
    db: Session = Depends(get_db)
):
    if session_id is None:
        raise HTTPException(status_code=401, detail="anonymous session not found")

    user = db.scalar(
        select(AnonymousSession).where(AnonymousSession.session_id == session_id)
    )

    if user is None:
        raise HTTPException(status_code=404, detail="session not found in database")

    user.latitude = data.latitude
    user.longitude = data.longitude
    db.commit()

    return {"message": "location updated"}


# ── POST /api/nearby/enable-disable ──────────────────────────────────────────
@router.post("/enable-disable")
async def enable_nearby(
    session_id: str | None = Cookie(default=None),
    db: Session = Depends(get_db)
):
    if session_id is None:
        raise HTTPException(status_code=401, detail="anonymous session not found")

    user = db.scalar(
        select(AnonymousSession).where(AnonymousSession.session_id == session_id)
    )

    if user is None:
        raise HTTPException(status_code=404, detail="session not found in database")

    user.is_nearby_enabled = not user.is_nearby_enabled
    db.commit()
    db.refresh(user)

    message = "nearby enabled successfully" if user.is_nearby_enabled else "nearby disabled successfully"

    return {
        "message": message,
        "is_nearby_enabled": user.is_nearby_enabled
    }

@router.get("/peoples")
async def find_nearby_peoples(
    session_id: str | None = Cookie(Default=None),
    db: Session = Depends(get_db),
):
    
    if not session_id:
        raise HTTPException(status_code=401, detail="anonymous session not found")

    user=db.scalar(
        select(AnonymousSession).where(AnonymousSession.session_id == session_id)
    )

    if user is None:
        raise HTTPException(status_code=404, detail="session not found in database")

    if not user.is_nearby_enabled:
        raise HTTPException(status_code=400, detail="nearby is disabled")

    peoples=db.scalars(
        select(AnonymousSession)
        .where(
            (AnonymousSession.session_id != session_id) &
            (AnonymousSession.is_nearby_enabled == True)
        )
    ).all()

    curr_user_longitude=user.longitude
    curr_user_latitude=user.latitude

    result=[]
    radius=1000

    for p in peoples:
        longitude=p.longitude
        latitude=p.latitude

        d=distance(curr_user_latitude,curr_user_longitude,latitude,longitude)

        if d <= radius:
            is_friend = p in user.friends
            is_request_sent = user in p.friend_requests

            result.append(
                {
                    "distance_in_meters": d,
                    "name": p.name,
                    "session_id": p.session_id,
                    "avatar": p.avatar,
                    "status": p.status,
                    "gender": p.gender,
                    "is_friend": is_friend,
                    "is_request_sent": is_request_sent
                }
            )


    return{
        "nearby peoples":result
    }

def distance(lat1, lon1, lat2, lon2):
    R = 6371000  # meters

    lat1 = radians(lat1)
    lat2 = radians(lat2)

    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = (
        sin(dlat / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(dlon / 2) ** 2
    )

    c = 2 * asin(sqrt(a))

    return R * c