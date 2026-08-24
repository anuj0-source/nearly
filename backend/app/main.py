from fastapi import FastAPI
from api.routes.session import router as session_router
from api.routes.profile import router as profile_router
from api.routes.nearby import router as nearby_router
from fastapi.middleware.cors import CORSMiddleware
from database import engine,Base
from api.routes.chat import router as chat_router
from api.routes.friend import router as friend_router
from api.routes.messages import router as messages_router
from sqlalchemy import text

app=FastAPI(
    title="Nearly API",
    description="Anonymous nearby chat platform",
    version="1.0.0"
)

with engine.connect() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
    conn.commit()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","https://nearly-nine.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(friend_router)
app.include_router(chat_router)
app.include_router(session_router)
app.include_router(profile_router)
app.include_router(nearby_router)
app.include_router(messages_router)

@app.get("/health")
async def health():
    return {"Status":"Healthy"}

@app.get("/")
async def root():
    return {"message":"Welcome to Nearly 👻"}