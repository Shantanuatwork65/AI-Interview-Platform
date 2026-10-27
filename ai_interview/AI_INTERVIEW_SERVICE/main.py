from fastapi import FastAPI
import uvicorn
from routers.Interview import router as interview_router
from fastapi.middleware.cors import CORSMiddleware

api = FastAPI(
    version="0.0.1",
    title="AI Interview platform service",
    description="AI Interview platform using FatAPI "
)

api.include_router(interview_router)

app = CORSMiddleware(
    app=api,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)