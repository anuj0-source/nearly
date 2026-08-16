from fastapi import FastAPI
from api.routes.users import router as users_router

app=FastAPI(
    title="Nearly API",
    description="Anonymous nearby chat platform",
    version="1.0.0"
)

app.include_router(users_router)

@app.get("/health")
async def health():
    return {"Status":"Healthy"}

@app.get("/")
async def root():
    return {"message":"Welcome to Nearly 👻"}