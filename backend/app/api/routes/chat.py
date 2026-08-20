from fastapi import APIRouter,Response,Cookie,HTTPException,Depends,WebSocket,WebSocketDisconnect
from core.matching_queue import queue,conversations
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import select
from models.user import AnonymousSession
import uuid
from datetime import datetime

router=APIRouter(
    prefix="/api/chat"
)
connected_users={}

connections={}

@router.get("/match")
async def matchmaking(
    response: Response,
    session_id: str | None = Cookie(default=None),
    db: Session = Depends(get_db)
):
    if not session_id:
        raise HTTPException(
            status_code=404,
            detail="Session not created"
        )

    if session_id in queue:
        return{
            "matched":False,
            "message": "Already waiting for a match"
        }
    
    user = db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == session_id)
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User session not found"
        )

    if queue:
        other_session_id = queue.popleft()

        conversation_id:str=str(uuid.uuid4())

        conversations.append({
            "conversation_id":conversation_id,
            "user_1":session_id,
            "user_2":other_session_id,
            "created_at":datetime.now()
        })

        return {
            "matched": True,
            "other_session_id": other_session_id,
            "conversation_id":conversation_id
        }

    queue.append(session_id)

    return {
        "matched": False,
        "message": "Matchmaking in progress"
    }
    
@router.websocket("/ws")
async def chat_websocket(session_id:str | None = Cookie(default=None), websocket: WebSocket):

    if not session_id:
        await websocket.close()
        raise HTTPException(
            status_code=404,
            detail="session not found"
        )

    if session_id in connected_users:
        return {
            "message":"Already connected"
        }
    
    await websocket.accept()

    connected_users[session_id]=websocket