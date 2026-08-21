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

matching={}

class ConnectionManager():
    def __init__(self):
        self.connections={}

    async def connect(self,websocket: WebSocket,session_id: str):
        if not session_id:
            raise HTTPException(
                status_code=404,
                detail="session not found"
            )

        await websocket.accept()

        self.connections[session_id]=websocket

    async def disconnect(self,session_id):
        websocket = self.connections.get(session_id)

        if websocket:
            await websocket.close()
            self.connections.pop(session_id, None)


    async def send_message(self, session_id, message):
        websocket = self.connections.get(session_id)

        if websocket:
            await websocket.send_text(message)

    async def send_json(self,session_id,json):
        websocket=self.connections[session_id]

        if websocket:
            await websocket.send_json(json)
        
   
manager=ConnectionManager()

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

        other_user=db.scalar(select(AnonymousSession).where(AnonymousSession.session_id == other_session_id))

        event_for_current = {
                "type": "match_found",
                "conversation_id": conversation_id,
                "match": {
                    "name": other_user.name,
                    "avatar": other_user.avatar,
                },
            }

        event_for_other={
            "type": "match_found",
            "conversation_id": conversation_id,
            "match": {
                     "name": user.name,
                     "avatar": user.avatar,
                    },
        }

        await manager.send_json(session_id, event_for_current)
        await manager.send_json(other_session_id, event_for_other)

        matching[session_id]=other_session_id
        matching[other_session_id]=session_id

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

@router.get("/match/cancel")
async def cancel_match(session_id: str | None = Cookie(default=None)):
    if not session_id:
        raise HTTPException(
            status_code=404,
            detail="session not found"
        )

    try:
        queue.remove(session_id)
        return{
            "message":"matchmaking cancelled"
        }
    except:
        return{
            "message":"session id not in matching"
        }
    
@router.websocket("/ws")
async def chat_websocket(websocket: WebSocket, session_id: str | None = Cookie(default=None)):

    if not session_id or session_id in manager.connections:
        await websocket.close()
        return

    await manager.connect(websocket=websocket,session_id=session_id)

    try:
        while True:
            message=await websocket.receive_text()

            matched_user=matching[session_id]

            if not matched_user:
                continue

            await manager.send_message(matched_user,message)
            
    except WebSocketDisconnect:
        await manager.disconnect(session_id)