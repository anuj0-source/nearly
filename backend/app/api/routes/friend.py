from fastapi import APIRouter,Response,Cookie,HTTPException,Depends
from database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import select
from models.user import AnonymousSession
from api.routes.chat import manager

router=APIRouter(
    prefix="/api/friend"
)

@router.post("/request/{friend_id}")
async def send_friend_request(
    friend_id : str,
    db : Session = Depends(get_db),
    session_id : str | None = Cookie(default=None)
):
    if not session_id or not friend_id:
        raise HTTPException(
            status_code=404,
            detail="session or friend_id not found"
        )
    
    user1=db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == session_id)
    )

    user2=db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == friend_id)
    )

    if not user1 or not user2:
        raise HTTPException(
            status_code=404,
            detail="user not found"
        )

    user2.friend_requests.append(user1)
    db.commit()
    db.refresh(user2)

    if user2.status=="active":
        await manager.send_json(
            friend_id,
            {
                "type":"notification",
                "event":"Sent friend request",
                "user":user1.name,
                "avatar":user1.avatar
            }
        )
    
    return {
        "message":"friend request sent"
    }


@router.get("/requests")
async def get_requests(
    session_id : str | None = Cookie(default=None),
    db : Session = Depends(get_db)
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
    
    return {
        "requests":user.friend_requests
    }

@router.post("/accept/{friend_id}")
async def accept_friend_request(
    friend_id : str,
    db : Session = Depends(get_db),
    session_id : str | None = Cookie(default=None)
):
    if not session_id or not friend_id:
        raise HTTPException(
            status_code=404,
            detail="session or friend_id not found"
        )
    
    user1=db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == session_id)
    )

    user2=db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == friend_id)
    )

    if not user1 or not user2:
        raise HTTPException(
            status_code=404,
            detail="user not found"
        )

    user2.friends.append(user1)
    user1.friends.append(user2)
    user1.friend_requests.remove(user2)
    db.commit()
    db.refresh(user2)
    db.refresh(user1)

    if user2.status=="active":
        await manager.send_json(
            friend_id,
            {
                "type":"notification",
                "event":"Accepted your friend request",
                "user":user1.name,
                "avatar":user1.avatar
            }
        )
    
    return {
        "message":"friend request accepted"
    }

@router.get("/friends")
async def get_friends(
    session_id : str | None = Cookie(default=None),
    db : Session = Depends(get_db)
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
    
    # Enrich friends with live online status
    from api.routes.chat import manager as ws_manager
    friends_list = []
    for f in user.friends:
        is_online = f.session_id in ws_manager.connections
        friends_list.append({
            "id": f.id,
            "session_id": f.session_id,
            "name": f.name,
            "avatar": f.avatar,
            "status": "active" if is_online else "inactive"
        })
    
    return {
        "friends": friends_list
    }

@router.post("/reject/{sender_id}")
async def reject_friend_request(
    sender_id : str,
    session_id : str | None = Cookie(default=None),
    db : Session = Depends(get_db)
):
    if not session_id or not sender_id:
        raise HTTPException(
            status_code=404,
            detail="session or sender_id not found"
        )
    
    user1=db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == session_id)
    )

    user2=db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == sender_id)
    )

    if not user1 or not user2:
        raise HTTPException(
            status_code=404,
            detail="user not found"
        )

    user1.friend_requests.remove(user2)
    db.commit()
    db.refresh(user1)

    return {
        "message":"friend request rejected"
    }

@router.post("/remove/{friend_id}")
async def remove_friend(
    friend_id : str,
    session_id : str | None = Cookie(default=None),
    db : Session = Depends(get_db)
):
    if not session_id or not friend_id:
        raise HTTPException(
            status_code=404,
            detail="session or friend_id not found"
        )
    
    user1=db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == session_id)
    )

    user2=db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == friend_id)
    )

    if not user1 or not user2:
        raise HTTPException(
            status_code=404,
            detail="user not found"
        )

    user1.friends.remove(user2)
    user2.friends.remove(user1)
    db.commit()
    db.refresh(user1)
    db.refresh(user2)

    return {
        "message":"friend removed"
    }