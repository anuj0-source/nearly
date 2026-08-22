from fastapi import APIRouter,Response,Cookie,HTTPException,Depends,WebSocket,WebSocketDisconnect
from core.matching_queue import queue,conversations
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import select
from models.user import AnonymousSession
import uuid
import json
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

    async def disconnect(self,session_id,websocket=None):
        current = self.connections.get(session_id)

        if current and (websocket is None or current is websocket):
            try:
                await current.close()
            except RuntimeError:
                pass
            self.connections.pop(session_id, None)


    async def send_message(self, session_id, message):
        websocket = self.connections.get(session_id)

        if websocket:
            await websocket.send_text(message)

    async def send_json(self,session_id,json):
        websocket=self.connections.get(session_id)

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
async def chat_websocket(
    websocket: WebSocket,
    session_id: str | None = Cookie(default=None),
    session_id_param: str | None = None,  # ?session_id= query param
    db: Session = Depends(get_db)
):
    # Browsers don't send cookies on cross-origin WebSocket upgrades,
    # so accept session_id as a query param fallback.
    resolved_session_id = session_id or session_id_param or websocket.query_params.get("session_id")

    if not resolved_session_id:
        await websocket.close()
        return


    await manager.connect(websocket=websocket, session_id=resolved_session_id)

    user1 = db.scalar(
        select(AnonymousSession)
        .where(AnonymousSession.session_id == resolved_session_id)
    )

    user1.status="active"
    db.commit()
    db.refresh(user1)

    if not user1:
        await websocket.close()
        return

    try:
        while True:
            text = await websocket.receive_text()

            if not text:
                continue

            try:
                payload = json.loads(text)
            except json.JSONDecodeError:
                continue

            matched_user = matching.get(resolved_session_id)

            if not matched_user:
                continue

            await manager.send_json(
                    matched_user,
                    payload
            )
            
    except WebSocketDisconnect:
        await manager.disconnect(resolved_session_id, websocket)

        user1.status="inacive"
        db.commit()
        db.refresh(user1)

        # Notify the partner that this user left, then clean up both sides.
        other = matching.pop(resolved_session_id, None)
        if other:
            matching.pop(other, None)
            await manager.send_json(other, {"type": "user_left"})