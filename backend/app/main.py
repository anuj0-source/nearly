from fastapi import FastAPI
from api.routes.session import router as session_router
from api.routes.profile import router as profile_router
from api.routes.nearby import router as nearby_router

app=FastAPI(
    title="Nearly API",
    description="Anonymous nearby chat platform",
    version="1.0.0"
)

app.include_router(session_router)
app.include_router(profile_router)
app.include_router(nearby_router)

@app.get("/health")
async def health():
    return {"Status":"Healthy"}

@app.get("/")
async def root():
    return {"message":"Welcome to Nearly 👻"}