from pydantic import BaseModel

class AnonymousUser(BaseModel):
    session_id: str
    name: str
    avatar: str
    language:str = "hinglish"
    gender:str = "not-defined"
    longitude:float | None = None
    latitude:float | None = None


sessions: dict[str, AnonymousUser] = {}
