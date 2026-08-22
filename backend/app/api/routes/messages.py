from fastapi import APIRouter,Cookie,Depends,HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from models.user import AnonymousSession
from models.message import Message
from models.conversation import Conversation
from database import get_db

router=APIRouter(
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

    return conversations

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