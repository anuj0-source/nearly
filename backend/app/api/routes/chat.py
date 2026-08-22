from fastapi import APIRouter,Response,Cookie,HTTPException,Depends,WebSocket,WebSocketDisconnect
from core.matching_queue import queue,conversations
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import select
from models.user import AnonymousSession
import uuid
import json
from datetime import datetime
from models.conversation import Conversation
from models.message import Message

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

        other_user=db.scalar(select(AnonymousSession).where(AnonymousSession.session_id == other_session_id))

        is_friend = False
        if other_user and user:
            is_friend = other_user in user.friends

        if not is_friend:
            conversation_id:str=str(uuid.uuid4())
        else:
            conversation_id=conversation = db.scalar(
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
            ).conversation_id
            

        conversations.append({
            "conversation_id":conversation_id,
            "user_1":session_id,
            "user_2":other_session_id,
            "created_at":datetime.now()
        })


        event_for_current = {
                "type": "match_found",
                "conversation_id": conversation_id,
                "match": {
                    "name": other_user.name,
                    "avatar": other_user.avatar,
                    "session_id": other_session_id,
                    "is_friend": is_friend
                },
            }

        event_for_other={
            "type": "match_found",
            "conversation_id": conversation_id,
            "match": {
                     "name": user.name,
                     "avatar": user.avatar,
                     "session_id": session_id,
                     "is_friend": is_friend
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

    conversation_id:str=None
    user2:AnonymousSession | None =None

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

            if payload["type"] == "chat_message":
                text_content = payload.get("text") or payload.get("message")
                
                # Find the conversation_id from memory
                conv_id = None
                for c in conversations:
                    if (c["user_1"] == resolved_session_id and c["user_2"] == matched_user) or \
                       (c["user_1"] == matched_user and c["user_2"] == resolved_session_id):
                        conv_id = c["conversation_id"]
                        break
                
                if conv_id:
                    user2 = db.scalar(select(AnonymousSession).where(AnonymousSession.session_id == matched_user))
                    db_conv = db.scalar(select(Conversation).where(Conversation.conversation_id == conv_id))
                    if not db_conv:
                        db_conv = Conversation(
                            conversation_id=conv_id,
                            user1_session_id=resolved_session_id,
                            user2_session_id=matched_user
                        )
                        db.add(db_conv)
                        db.commit()
                        
                    if text_content:
                        db_msg = Message(
                            conversation_id=conv_id,
                            sender_id=resolved_session_id,
                            receiver_id=matched_user,
                            message=text_content
                        )
                        db.add(db_msg)
                        db.commit()

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