from fastapi import APIRouter, Cookie, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid
from models.user import AnonymousSession
from models.message import Message
from models.conversation import Conversation
from database import get_db

router = APIRouter(
    prefix="/api/messages"
)

class SendMessageBody(BaseModel):
    conversation_id: str
    message: str

@router.get("/conversations")
async def get_conversations(
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

    conversations = db.scalars(
        select(Conversation)
        .where(
            (Conversation.user1_session_id == session_id) |
            (Conversation.user2_session_id == session_id)
        )
        .order_by(Conversation.created_at.desc())
    ).all()

    from api.routes.chat import manager as ws_manager
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
        result.append({
            "conversation_id": conv.conversation_id,
            "user1_session_id": conv.user1_session_id,
            "user2_session_id": conv.user2_session_id,
            "created_at": conv.created_at,
            "partner_name": partner.name if partner else "Unknown",
            "partner_avatar": partner.avatar if partner else None,
            "partner_status": "active" if is_online else "inactive",
            "is_friend": partner in user.friends if partner else False,
        })

    return result

@router.get("/partner-status/{partner_session_id}")
async def get_partner_status(
    partner_session_id: str,
    session_id: str | None = Cookie(default=None),
):
    if not session_id:
        raise HTTPException(status_code=401, detail="No session found")

    from api.routes.chat import manager as ws_manager
    is_online = partner_session_id in ws_manager.connections

    return {"status": "active" if is_online else "inactive"}

@router.get("/messages/{conversation_id}")

async def get_messages(
    conversation_id : str,
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
            Message.conversation_id == conversation_id
        )
        .order_by(Message.created_at.asc())
    ).all()
    
    return messages

@router.get("/conversation/{partner_session_id}")
async def get_friend_messages(
    partner_session_id: str,
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
    # if not friend:
    #     raise HTTPException(status_code=404, detail="Friend not found")

    # SQLAlchemy requires & / | for column-level boolean logic, not Python and/or
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
        .order_by(Message.created_at.asc())
    ).all()

    return {
        "conversation_id": conversation.conversation_id,
        "partner_name": friend.name,
        "partner_avatar": friend.avatar,
        "is_friend": friend in user.friends,
        "messages": messages,
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

    # Persist the message
    db_msg = Message(
        conversation_id=body.conversation_id,
        sender_id=session_id,
        receiver_id=partner_id,
        message=body.message,
    )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)

    # Deliver via WebSocket if the partner is currently online
    # (import here to avoid circular imports)
    from api.routes.chat import manager, pending_messages
    payload = {
        "type": "chat_message",
        "text": body.message,
        "conversation_id": body.conversation_id,
    }
    await manager.send_json(partner_id, payload)

    return {
        "id": db_msg.id,
        "conversation_id": db_msg.conversation_id,
        "sender_id": db_msg.sender_id,
        "receiver_id": db_msg.receiver_id,
        "message": db_msg.message,
        "created_at": db_msg.created_at,
    }

