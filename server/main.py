from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import init_db, save_lead

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

class GenerateRequest(BaseModel):
    email: str
    db_type: str
    modules: list[str]
    pro_feature_vote: str
    sean_ellis_vote: str

@app.post("/api/generate")
def generate_bot(request: GenerateRequest):
    save_lead(
        email=request.email,
        modules=request.modules,
        db_type=request.db_type,
        pro_feature=request.pro_feature_vote,
        sean_ellis=request.sean_ellis_vote
    )

    return {"status": "success", "message": "Архів згенеровано!"}