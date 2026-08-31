from datetime import datetime
from fastapi import APIRouter,Response,Cookie,HTTPException,Depends
from database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import select
from models.user import AnonymousSession
from api.routes.chat import manager
from models.notification import Notification
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
                "avatar":user1.avatar,
                "session_id":user1.session_id
            }
        )
    
    notification=Notification(
        session_id=user2.id,
        type="friend_request",
        payload={
            "user":user1.name,
            "avatar":user1.avatar,
            "session_id":user1.session_id
        },
        is_read=False,
        created_at=datetime.now()
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)
    
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
    
    requests_list = []
    for r in user.friend_requests:
        requests_list.append({
            "id": r.id,
            "session_id": r.session_id,
            "name": r.name,
            "avatar": r.avatar
        })
    
    return {
        "requests": requests_list
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
                "avatar":user1.avatar,
                "session_id":user1.session_id
            }
        )

    accept_notification = Notification(
        session_id=user2.id,
        type="friend_request_accepted",
        payload={
            "user": user1.name,
            "avatar": user1.avatar
        },
        is_read=False,
        created_at=datetime.now()
    )
    db.add(accept_notification)

    # Clean up the incoming friend_request notification for the accepter (user1)
    old_notification = db.scalar(
        select(Notification)
        .where(
            Notification.session_id == user1.id,
            Notification.type == "friend_request",
            Notification.payload["session_id"].as_string() == friend_id
        )
    )
    if old_notification:
        db.delete(old_notification)

    db.commit()

    return {
        "message": "friend request accepted"
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

    if user2.status == "active":
        await manager.send_json(
            sender_id,
            {
                "type": "notification",
                "event": "Rejected your friend request",
                "user": user1.name,
                "avatar": user1.avatar,
                "session_id": user1.session_id
            }
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

    if user2.status=="active":
        await manager.send_json(
            friend_id,
            {
                "type":"notification",
                "event":"Removed you from friends",
                "user":user1.name,
                "avatar":user1.avatar,
                "session_id":user1.session_id
            }
        )

    notification=Notification(
        session_id=user2.id,
        type="friend_removed",
        payload={
            "user":user1.name,
            "avatar":user1.avatar
        },
        is_read=False,
        created_at=datetime.now()
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    return {
        "message":"friend removed"
    }

@router.post("/cancel-request/{receiver_session_id}")
async def cancel_request(
    receiver_session_id : str,
    session_id : str | None = Cookie(default=None),
    db : Session = Depends(get_db)
):

    if not session_id:
        raise HTTPException(
            status_code=404,
            detail="session not found"
        )

    if not receiver_session_id:
        raise HTTPException(
            status_code=404,
            detail="receiver's session not found"
        )

    users=db.scalars(
        select(AnonymousSession)
        .where(
            AnonymousSession.session_id.in_([
                session_id,
                receiver_session_id
            ])
        )
    ).all()

    sender=None
    reciever=None

    for u in users:
        if u.session_id == receiver_session_id:
            reciever=u
        elif u.session_id == session_id:
            sender=u

    if not sender or not reciever:
        raise HTTPException(
            status_code=404,
            detail="user not found"
        )

    from models.user import friend_requests
    from sqlalchemy import delete

    request=db.scalar(
        select(friend_requests)
        .where(
            friend_requests.c.user_id == reciever.id,
            friend_requests.c.sender_id == sender.id
        )
    )

    if not request:
        raise HTTPException(
            status_code=404,
            detail="request not found"
        )

    notification=db.scalar(
        select(Notification)
        .where(
            Notification.session_id == reciever.id,
            Notification.type == "friend_request",
            Notification.payload["session_id"].as_string() == session_id
        )
    )

    if notification:
        db.delete(notification)
        db.commit()

    db.execute(
        delete(friend_requests)
        .where(
            friend_requests.c.user_id == reciever.id,
            friend_requests.c.sender_id == sender.id
        )
    )
    db.commit()

    if reciever.status=="active":
        await manager.send_json(
            receiver_session_id,
            {
                "type":"notification",
                "event":"Cancelled your friend request",
                "user":sender.name,
                "avatar":sender.avatar,
                "session_id":sender.session_id
            }
        )

    return{
        "message":"requst cancelled"
    }
