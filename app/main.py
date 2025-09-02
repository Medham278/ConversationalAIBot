"""
Simple FastAPI backend for OpenAI chat
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import openai

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI(title="AI Chat API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

class ChatResponse(BaseModel):
    answer: str
    session_id: str

@app.get("/")
async def root():
    return {"message": "AI Chat API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/chat/start")
async def start_session():
    return {"session_id": "default", "status": "active"}

@app.post("/chat/message", response_model=ChatResponse)
async def chat_message(request: ChatRequest):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": request.message}
            ],
            max_tokens=150
        )
        
        answer = response.choices[0].message.content.strip()
        
        return ChatResponse(
            answer=answer,
            session_id=request.session_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")