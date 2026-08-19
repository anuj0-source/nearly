from fastapi import APIRouter,Response,Cookie
import uuid
import random

from core.session import sessions,AnonymousUser

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

avatars = ["🦊", "🐼", "🦉", "🐯", "🐻", "👻"]

@router.post("/anonymous")
async def create_anonymous_session(response:Response,session_id:str | None = Cookie(default=None)):
    if session_id in sessions:
        return {**sessions[session_id].model_dump(),"new_session":False}

    else:
        new_session_id=str(uuid.uuid4())
        first_name_index=random.randrange(len(ADJECTIVES))
        last_name_index=random.randrange(len(ANIMALS))

        seed = random.randint(1, 1000000)

        avatar=f"https://api.dicebear.com/9.x/notionists/svg?seed={seed}"

        user=AnonymousUser(
            name = f"{ADJECTIVES[first_name_index]} {ANIMALS[last_name_index]}",
            avatar=avatar,
            session_id=new_session_id
        )

        sessions[new_session_id]=user

        response.set_cookie(
            key="session_id",
            value=new_session_id,
            httponly=True,
            samesite="lax",
            max_age=60 * 60 * 24 * 7
        )

        return {
            "session_id":new_session_id,
            "name":user.name,
            "avatar":user.avatar,
            "new_session":True
        }

@router.get("/me")
async def get_me(response:Response,session_id:str | None = Cookie(default=None)):
    if session_id not in sessions:
        return await create_anonymous_session(response)
    else:
        return sessions[session_id]