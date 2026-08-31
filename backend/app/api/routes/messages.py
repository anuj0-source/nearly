from fastapi import APIRouter, Cookie, Depends, HTTPException,UploadFile,File
from sqlalchemy import select, or_, desc, func
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid
from models.user import AnonymousSession
from models.message import Message
from models.conversation import Conversation
from database import get_db
from models.notification import Notification
from datetime import datetime, timedelta
from services.cloudinary_service import upload_image,delete_image
from api.routes.chat import manager as ws_manager

router = APIRouter(
    prefix="/api/messages"
)

class SendMessageBody(BaseModel):
    conversation_id: str
    message: str
    reply_of: int | None = None

class EditMessageBody(BaseModel):
    message: str

@router.get("/conversations")
async def get_conversations(
    skip: int = 0,
    limit: int = 7,
    session_id: str | None = Cookie(default=None),
    db: Session = Depends(get_db)
):
    if not session_id:
        raise HTTPException(
            status_code=400,
            detail="Session not found"
        )

    user = db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == session_id)
    )

    if not user:
        raise HTTPException(
            status_code=400,
            detail="User session not found"
        )

    last_message_subq = (
        select(func.max(Message.created_at))
        .where(Message.conversation_id == Conversation.conversation_id)
        .correlate(Conversation)
        .scalar_subquery()
    )

    conversations = db.scalars(
        select(Conversation)
        .where(
            (Conversation.user1_session_id == session_id) |
            (Conversation.user2_session_id == session_id)
        )
        .order_by(func.coalesce(last_message_subq, Conversation.created_at).desc())
        .offset(skip)
        .limit(limit)
    ).all()

    result = []
    for conv in conversations:
        partner_session_id = (
            conv.user2_session_id
            if conv.user1_session_id == session_id
            else conv.user1_session_id
        )
        partner = db.scalar(
            select(AnonymousSession)
            .where(AnonymousSession.session_id == partner_session_id)
        )
        is_online = partner_session_id in ws_manager.connections

        last_message = db.scalar(
            select(Message)
            .where(Message.conversation_id == conv.conversation_id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )

        unread_count = db.scalar(
            select(func.count(Message.id))
            .where(
                (Message.conversation_id == conv.conversation_id) &
                (Message.receiver_id == session_id) &
                (Message.is_read == False)
            )
        )

        result.append({
            "conversation_id": conv.conversation_id,
            "user1_session_id": conv.user1_session_id,
            "user2_session_id": conv.user2_session_id,
            "created_at": conv.created_at,
            "partner_name": partner.name if partner else "Unknown",
            "partner_avatar": partner.avatar if partner else None,
            "partner_status": "active" if is_online else "inactive",
            "is_friend": partner in user.friends if partner else False,
            "last_message_text": last_message.message if last_message else None,
            "last_message_time": last_message.created_at if last_message else None,
            "last_message_type": last_message.type if last_message else None,
            "unread_count": unread_count or 0,
        })

    # Keep sorting in memory just in case, but it should already be sorted from DB
    result.sort(key=lambda x: x["last_message_time"] or x["created_at"], reverse=True)

    return result

@router.post("/read/{conversation_id}")
async def mark_messages_as_read(
    conversation_id: str,
    session_id: str | None = Cookie(default=None),
    db: Session = Depends(get_db)
):
    if not session_id:
        raise HTTPException(status_code=401, detail="No session found")

    user = db.scalar(select(AnonymousSession).where(AnonymousSession.session_id == session_id))

    messages = db.scalars(
        select(Message)
        .where(
            (Message.conversation_id == conversation_id) &
            (Message.receiver_id == session_id) &
            (Message.is_read == False)
        )
    ).all()

    for msg in messages:
        msg.is_read = True

    if user:
        notifications = db.scalars(
            select(Notification)
            .where(
                (Notification.session_id == user.id) &
                (Notification.type == "message")
            )
        ).all()
        for notif in notifications:
            if isinstance(notif.payload, dict) and notif.payload.get("conversation_id") == conversation_id:
                db.delete(notif)

    db.commit()

    return {"status": "ok", "marked_count": len(messages)}

@router.get("/partner-status/{partner_session_id}")
async def get_partner_status(partner_session_id: str):
    is_online = partner_session_id in ws_manager.connections

    return {"status": "active" if is_online else "inactive"}

@router.get("/messages/{conversation_id}")
async def get_messages(
    conversation_id : str,
    skip: int = 0,
    limit: int = 15,
    session_id : str | None = Cookie(default=None),
    db : Session = Depends(get_db)
):
    if not session_id:
        raise HTTPException(
            status_code=404,
            detail="No session found"
        )
    
    user =db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == session_id)
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    messages = db.scalars(
        select(Message)
        .where(
            (Message.conversation_id == conversation_id) & 
            ((Message.sender_id == session_id) | (Message.receiver_id == session_id))
        )
        .order_by(Message.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()
    
    return list(reversed(messages))

@router.get("/conversation/{partner_session_id}")
async def get_partner_conversation_messages(
    partner_session_id: str,
    skip: int = 0,
    limit: int = 15,
    session_id: str | None = Cookie(default=None),
    db: Session = Depends(get_db)
):
    if not session_id:
        raise HTTPException(status_code=404, detail="No session found")

    user = db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == session_id)
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    friend = db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == partner_session_id)
    )

    conversation = db.scalar(
        select(Conversation)
        .where(
            (
                (Conversation.user1_session_id == session_id) &
                (Conversation.user2_session_id == partner_session_id)
            ) |
            (
                (Conversation.user1_session_id == partner_session_id) &
                (Conversation.user2_session_id == session_id)
            )
        )
    )

    if not conversation:
        conversation=Conversation(
            conversation_id=str(uuid.uuid4()),
            user1_session_id=session_id,
            user2_session_id=partner_session_id
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    messages = db.scalars(
        select(Message)
        .where(Message.conversation_id == conversation.conversation_id)
        .order_by(Message.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()

    is_online = partner_session_id in ws_manager.connections

    # Determine request direction
    # user.friend_requests = people who sent requests TO user (user is receiver)
    # So: friend in user.friend_requests → friend sent to me → I RECEIVED a request
    #     user in friend.friend_requests → I sent to friend → I SENT a request
    is_request_received = friend in user.friend_requests if friend else False
    is_request_sent = user in friend.friend_requests if friend else False

    return {
        "conversation_id": conversation.conversation_id,
        "partner_name": friend.name if friend else "Unknown",
        "partner_avatar": friend.avatar if friend else None,
        "is_friend": friend in user.friends if friend else False,
        "is_request_sent": is_request_sent,
        "is_request_received": is_request_received,
        "partner_status": "active" if is_online else "inactive",
        "messages": list(reversed(messages)),
    }

@router.post("/send")
async def send_message(
    body: SendMessageBody,
    session_id: str | None = Cookie(default=None),
    db: Session = Depends(get_db)
):
    if not session_id:
        raise HTTPException(status_code=401, detail="No session found")

    user = db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == session_id)
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify the user belongs to this conversation
    conversation = db.scalar(
        select(Conversation)
        .where(Conversation.conversation_id == body.conversation_id)
        .where(
            (Conversation.user1_session_id == session_id) |
            (Conversation.user2_session_id == session_id)
        )
    )
    if not conversation:
        raise HTTPException(status_code=403, detail="Not part of this conversation")

    # Determine the partner
    partner_id = (
        conversation.user2_session_id
        if conversation.user1_session_id == session_id
        else conversation.user1_session_id
    )

    partner = db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == partner_id)
    )
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    # Persist the message
    db_msg = Message(
        conversation_id=body.conversation_id,
        sender_id=session_id,
        receiver_id=partner_id,
        message=body.message,
        reply_of=body.reply_of,
    )

    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)

    # Deliver via WebSocket if the partner is currently online
    # (import here to avoid circular imports)
    from api.routes.chat import manager, pending_messages
    payload = {
        "type": "chat_message",
        "id": db_msg.id,
        "text": body.message,
        "conversation_id": body.conversation_id,
        "sender_id": session_id,
        "sender_name": user.name,
        "sender_avatar": user.avatar,
        "reply_of": db_msg.reply_of,
    }
    await manager.send_json(partner_id, payload)

    notifications=db.scalars(
        select(Notification)
        .where(Notification.session_id == partner.id)
        .where(Notification.type == "message")
    ).all()

    for notif in notifications:
        if notif.payload['conversation_id'] == body.conversation_id:
            db.delete(notif)
            db.commit()

    notification=Notification(
        session_id=partner.id,
        type="message",
        payload={
            "conversation_id":body.conversation_id,
            "sender_id":session_id,
            "sender_name":user.name,
            "sender_avatar":user.avatar,
        },
        is_read=False,
        created_at=datetime.now()
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    return {
        "id": db_msg.id,
        "conversation_id": db_msg.conversation_id,
        "sender_id": db_msg.sender_id,
        "receiver_id": db_msg.receiver_id,
        "message": db_msg.message,
        "created_at": db_msg.created_at,
        "reply_of": db_msg.reply_of,
    }

@router.delete("/delete/{message_id}")
async def delete_message(
    message_id: int,
    session_id : str | None = Cookie(default=None),
    db : Session = Depends(get_db)
):

    if not session_id:
        raise HTTPException(
            status_code=404,
            detail="No session found"
        )

    user = db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == session_id)
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="user not found"
        )

    message = db.scalar(
        select(Message)
        .where(Message.id == message_id)
    )

    if not message:
        raise HTTPException(
            status_code=404,
            detail="message not found"
        )
        
    if message.sender_id != session_id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own messages"
        )

    if message.type == "image":
        file_part = message.message.split("nearly/messages/")[-1]
        file_name = file_part.rsplit(".", 1)[0]
        public_id = f"nearly/messages/{file_name}"
        await delete_image(public_id)
        
    receiver_id = message.receiver_id
    conversation_id = message.conversation_id

    db.delete(message)
    db.commit()
    
    await ws_manager.send_json(
        receiver_id,
        {
            "type": "message_deleted",
            "message_id": message_id,
            "conversation_id": conversation_id
        }
    )
    
    return{
        "message":"message deleted"
    }

@router.post("/edit/{message_id}")
async def edit_message(
    message_id: int,
    body: EditMessageBody,
    session_id : str | None = Cookie(default=None),
    db : Session = Depends(get_db)
):

    if not session_id:
        raise HTTPException(
            status_code=404,
            detail="No session found"
        )

    user = db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == session_id)
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="user not found"
        )

    message = db.scalar(
        select(Message)
        .where(Message.id == message_id)
    )

    if not message:
        raise HTTPException(
            status_code=404,
            detail="message not found"
        )
        
    if message.sender_id != session_id:
        raise HTTPException(
            status_code=403,
            detail="You can only edit your own messages"
        )

    if datetime.utcnow() - message.created_at > timedelta(hours=2):
        raise HTTPException(
            status_code=403,
            detail="You can only edit your own messages within 2 hours"
        )
        
    message.message = body.message
    message.edited = True
    db.commit()
    db.refresh(message)

    await ws_manager.send_json(
        message.receiver_id,
        {
            "type": "message_edited",
            "message_id": message_id,
            "conversation_id": message.conversation_id,
            "message": message.message
        }
    )
    
    return{
        "message":"message edited"
    }

@router.post("/send-image")
async def send_image(
    conversation_id: str,
    local_id: str | None = None,
    image:UploadFile = File(...),
    session_id : str | None = Cookie(default=None),
    db : Session = Depends(get_db)
):
    
    if not session_id:
        raise HTTPException(
            status_code=404,
            detail="No session found"
        )

    user = db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == session_id)
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="user not found"
        )

    conversation = db.scalar(
        select(Conversation)
        .where(Conversation.conversation_id == conversation_id)
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="conversation not found"
        )

    partner_id = conversation.user2_session_id if user.session_id == conversation.user1_session_id else conversation.user1_session_id
    
    partner = db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == partner_id)
    )
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    if image.content_type not in ["image/jpeg", "image/png", "image/gif", "image/webp"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid image type"
        )
    
    image_data = image.file.read()
    if len(image_data) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image size exceeds 10MB limit"
        )
    
    image_url = await upload_image(image_data, f"nearly/messages/{conversation_id}")

    if not image_url:
        return {"message": "upload failed"}

    message=Message(
        conversation_id=conversation_id,
        sender_id=session_id,
        receiver_id=partner_id,
        message=image_url["url"],
        type="image"
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    
    notifications=db.scalars(
        select(Notification)
        .where(Notification.session_id == partner.id)
        .where(Notification.type == "message")
    ).all()

    for notif in notifications:
        if notif.payload['conversation_id'] == conversation_id:
            db.delete(notif)
            db.commit()

    notification=Notification(
        session_id=partner.id,
        type="message",
        payload={
            "conversation_id":conversation_id,
            "sender_id":session_id,
            "sender_name":user.name,
            "sender_avatar":user.avatar,
        },
        is_read=False,
        created_at=datetime.now()
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    await ws_manager.send_json(
        partner_id,
        {
            "type": "image_message_sent",
            "message_id": message.id,
            "conversation_id": message.conversation_id,
            "message": message.message,
            "sender_id": message.sender_id,
            "sender_name": user.name,
            "sender_avatar": user.avatar
        }
    )
    
    return{
        "message":"message sent",
        "message_id": message.id,
        "url": image_url["url"],
        "local_id": local_id
    }