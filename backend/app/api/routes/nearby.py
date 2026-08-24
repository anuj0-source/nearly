from fastapi import APIRouter, HTTPException, Cookie, Depends
from schemas.location import LocationUpdate
from database import get_db
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, and_, func
from models.user import AnonymousSession
from geoalchemy2 import WKTElement

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

    point_wkt= f"POINT({data.longitude} {data.latitude})"

    user.location = WKTElement(point_wkt, srid=4326)
    db.commit()
    db.refresh(user)

    return {"message": "location updated successfully"}


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
    radius: int = 5000,
    session_id: str | None = Cookie(Default=None),
    db: Session = Depends(get_db),
):
    if not session_id:
        raise HTTPException(status_code=401, detail="anonymous session not found")

    user = db.scalar(
        select(AnonymousSession)
        .options(
            selectinload(AnonymousSession.friends),
            selectinload(AnonymousSession.friend_requests)
        )
        .where(AnonymousSession.session_id == session_id)
    )

    if user is None:
        raise HTTPException(status_code=404, detail="session not found")
    if not user.is_nearby_enabled or not user.location:
        raise HTTPException(status_code=400, detail="nearby is disabled or location unknown")

    user_friend_ids = {f.id for f in user.friends}

    radius_meters = radius

    # 2. Tell the database to calculate the exact distance
    distance_col = func.ST_Distance(AnonymousSession.location, user.location).label("distance_in_meters")

    # 3. Query the database using ST_DWithin (which automatically uses the GiST index)
    query = (
        select(AnonymousSession, distance_col)
        .options(selectinload(AnonymousSession.friend_requests))
        .where(
            and_(
                AnonymousSession.session_id != session_id,
                AnonymousSession.is_nearby_enabled == True,
                # ST_DWithin checks if two points are within X meters of each other
                func.ST_DWithin(AnonymousSession.location, user.location, radius_meters)
            )
        )
        .order_by(distance_col) # Sort directly in the database
    )

    # db.execute returns a tuple of (AnonymousSession, distance_in_meters)
    results = db.execute(query).all()

    response_data = []
    
    for p, distance in results:
        is_friend = p.id in user_friend_ids
        is_request_sent = user in p.friend_requests 

        response_data.append(
            {
                "distance_in_meters": round(distance, 2),
                "name": p.name,
                "session_id": p.session_id,
                "avatar": p.avatar,
                "status": p.status,
                "gender": p.gender,
                "is_friend": is_friend,
                "is_request_sent": is_request_sent
            }
        )

    return {
        "nearby_peoples": response_data
    }