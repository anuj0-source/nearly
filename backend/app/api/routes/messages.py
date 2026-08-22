from fastapi import APIRouter, Cookie, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from models.user import AnonymousSession
from models.message import Message
from models.conversation import Conversation
from database import get_db

router = APIRouter(
    prefix="/api/messages"
)

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

    # Enrich each conversation with the partner's real name and avatar
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
        result.append({
            "conversation_id": conv.conversation_id,
            "user1_session_id": conv.user1_session_id,
            "user2_session_id": conv.user2_session_id,
            "created_at": conv.created_at,
            "partner_name": partner.name if partner else "Unknown",
            "partner_avatar": partner.avatar if partner else None,
        })

    return result

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

@router.get("/friend-messages/{friend_session_id}")
async def get_friend_messages(
    friend_session_id: str,
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
        .where(AnonymousSession.session_id == friend_session_id)
    )
    if not friend:
        raise HTTPException(status_code=404, detail="Friend not found")

    # SQLAlchemy requires & / | for column-level boolean logic, not Python and/or
    conversation = db.scalar(
        select(Conversation)
        .where(
            (
                (Conversation.user1_session_id == session_id) &
                (Conversation.user2_session_id == friend_session_id)
            ) |
            (
                (Conversation.user1_session_id == friend_session_id) &
                (Conversation.user2_session_id == session_id)
            )
        )
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = db.scalars(
        select(Message)
        .where(Message.conversation_id == conversation.conversation_id)
        .order_by(Message.created_at.asc())
    ).all()

    return {
        "conversation_id": conversation.conversation_id,
        "partner_name": friend.name,
        "partner_avatar": friend.avatar,
        "messages": messages,
    }