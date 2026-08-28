from fastapi import APIRouter,Response,Cookie,Depends
from sqlalchemy.orm import Session
import uuid
import random
from sqlalchemy import select, func

from models.user import AnonymousSession
from database import get_db

router=APIRouter(
    prefix="/api/session",
    tags=["Session"]
)

ADJECTIVES = [
    "Silent",
    "Curious",
    "Hidden",
    "Quiet",
    "Lucky",
    "Midnight",
    "Secret",
    "Wandering",
    "Unknown",
    "Clever",
    "Calm",
    "Cosmic",
    "Gentle",
    "Lost",
    "Lunar",
    "Shadow",
    "Dreamy",
    "Misty",
    "Chill",
    "Velvet",
    "Fuzzy",
    "Sleepy",
    "Swift",
    "Sneaky",
    "Brave",
    "Cozy",
    "Wild",
    "Tiny",
    "Happy",
    "Lazy",
    "Mellow",
    "Jolly",
    "Witty",
    "Shy",
    "Friendly",
    "Noble",
    "Playful",
    "Daring",
    "Neon",
    "Silver",
    "Golden",
    "Frosty",
    "Stormy",
    "Sunny",
    "Cloudy",
    "Rainy",
    "Autumn",
    "Electric",
    "Whispering",
    "Wandering",
]

ANIMALS = [
    "Fox",
    "Owl",
    "Panda",
    "Cat",
    "Wolf",
    "Otter",
    "Penguin",
    "Koala",
    "Rabbit",
    "Bear",
    "Tiger",
    "Lion",
    "Deer",
    "Raccoon",
    "Badger",
    "Hedgehog",
    "Squirrel",
    "Hamster",
    "Monkey",
    "Parrot",
    "Swan",
    "Dolphin",
    "Whale",
    "Seal",
    "Turtle",
    "Frog",
    "Lynx",
    "Moose",
    "Bison",
    "Falcon",
    "Eagle",
    "Hawk",
    "Robin",
    "Sparrow",
    "Butterfly",
    "Firefly",
    "Bee",
    "Moth",
    "Crane",
    "Raven",
]

@router.post("/anonymous")
async def create_anonymous_session(response:Response,session_id:str | None = Cookie(default=None),db : Session = Depends(get_db)):

    # If a session cookie exists, check if it's still valid in the DB
    if session_id:
        stmt=select(AnonymousSession).where(AnonymousSession.session_id == session_id)
        user=db.scalar(statement=stmt)

        if user:
            return {
                    "session_id":user.session_id,
                    "name":user.name,
                    "avatar":user.avatar,
                    "new_session":False
                }
        # If cookie exists but record is gone (stale/DB reset), fall through to create a new session

    # Create a new anonymous session (new visitor OR stale cookie)
    new_session_id=str(uuid.uuid4())
    first_name_index=random.randrange(len(ADJECTIVES))
    last_name_index=random.randrange(len(ANIMALS))

    seed = random.randint(1, 1000000)

    avatar=f"https://api.dicebear.com/9.x/notionists/svg?seed={seed}&backgroundColor=ff3366,20b2aa,00bfff,9370db,ff7f50,3cb371,1e90ff,ff1493,00fa9a,ffa500,8a2be2,ff4500,adff2f,00ced1"

    user=AnonymousSession(
        name = f"{ADJECTIVES[first_name_index]} {ANIMALS[last_name_index]}",
        avatar=avatar,
        session_id=new_session_id
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    response.set_cookie(
        key="session_id",
        value=new_session_id,
        httponly=True,
        samesite="none",
        secure=True,
        max_age=60 * 60 * 24 * 7
    )

    return {
        "session_id":new_session_id,
        "name":user.name,
        "avatar":user.avatar,
        "new_session":True
    }

@router.get("/me")
async def get_me(response:Response,session_id:str | None = Cookie(default=None), db :Session = Depends(get_db)):

    stmt=select(AnonymousSession).where(AnonymousSession.session_id == session_id)
    user = db.scalar(stmt)

    if not user:
        res=await create_anonymous_session(response,session_id,db=db)
        new_session_id=res["session_id"]
        user=db.scalar(select(AnonymousSession).where(AnonymousSession.session_id == new_session_id))
    
    lon, lat = None, None
    if user.location is not None:
        lon, lat = db.execute(select(func.ST_X(user.location), func.ST_Y(user.location))).first()

    return {
        "session_id":user.session_id,
        "name":user.name,
        "avatar":user.avatar,
        "language":user.language,
        "gender":user.gender,
        "latitude":lat,
        "longitude":lon,
        "created_at":user.created_at
        }