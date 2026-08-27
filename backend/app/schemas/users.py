from pydantic import BaseModel

class UserEdit(BaseModel):
    name: str | None = None
    language: str | None = None
    gender:str | None = None
