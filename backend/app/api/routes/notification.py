from fastapi import APIRouter,Response,Cookie,Depends,HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from models.user import AnonymousSession
from models.notification import Notification
from database import get_db

router=APIRouter(
    prefix="/api/notification",
    tags=["Notification"]
)

@router.get("/all")
async def get_notifications(
    session_id:str | None = Cookie(default=None),
    db:Session = Depends(get_db)
):
    if not session_id:
        raise HTTPException(
            status_code=404,
            detail="session not found"
        )

    user=db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == session_id)
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="user not found"
        )
    
    notifications=db.scalars(
        select(Notification)
        .where(Notification.session_id == user.id)
        .order_by(Notification.created_at.desc())
    ).all()

    notification_list=[]
    for notification in notifications:
        notification_list.append({
            "id":notification.id,
            "type":notification.type,
            "payload":notification.payload,
            "is_read":notification.is_read,
            "created_at":notification.created_at
        })
    
    return {
        "notifications":notification_list
    }

@router.post("/read/{notification_id}")
async def read_notification(
    notification_id:int,
    session_id:str | None = Cookie(default=None),
    db:Session = Depends(get_db)
):
    if not session_id:
        raise HTTPException(
            status_code=404,
            detail="session not found"
        )

    user=db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == session_id)
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="user not found"
        )
    
    notification=db.scalar(
        select(Notification)
        .where(Notification.id == notification_id)
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="notification not found"
        )
    
    notification.is_read=True
    db.commit()
    db.refresh(notification)
    
    return {
        "message":"notification read"
    }

@router.post("/clear-all")
async def clear_all_notifications(
    session_id:str | None = Cookie(default=None),
    db:Session = Depends(get_db)
):
    if not session_id:
        raise HTTPException(
            status_code=404,
            detail="session not found"
        )

    user=db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == session_id)
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="user not found"
        )
    
    db.query(Notification).filter(Notification.session_id == user.id).delete()
    db.commit()
    
    return {
        "message":"all notifications cleared"
    }

@router.patch("/clear/{notification_id}")
async def clear_notification(
    notification_id:int,
    session_id:str | None = Cookie(default=None),
    db:Session = Depends(get_db)
):
    if not session_id:
        raise HTTPException(
            status_code=404,
            detail="session not found"
        )

    user=db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == session_id)
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="user not found"
        )
    
    notification=db.scalar(
        select(Notification)
        .where(Notification.id == notification_id)
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="notification not found"
        )
    
    db.delete(notification)
    db.commit()
    
    return {
        "message":"notification cleared"
    }

@router.post("/read-all")
async def read_all_notifications(
    session_id:str | None = Cookie(default=None),
    db:Session = Depends(get_db)
):
    if not session_id:
        raise HTTPException(
            status_code=404,
            detail="session not found"
        )

    user=db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == session_id)
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="user not found"
        )
    
    notifications=db.scalars(
        select(Notification)
        .where(Notification.session_id == user.id)
        .where(Notification.is_read == False)
    ).all()

    for notification in notifications:
        notification.is_read=True
    
    db.commit()

    return {
        "message":"all notifications read"
    }