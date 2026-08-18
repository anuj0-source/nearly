from pydantic import BaseModel,Field

class AnonymousUser(BaseModel):
    session_id: str
    name: str
    avatar: str
    interests:list[str]=Field(default_factory=list)
    language:str = "hinglish"
    gender:str = "not-defined"
    longitude:float | None = None
    latitude:float | None = None


sessions: dict[str, AnonymousUser] = {}