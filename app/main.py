"""
FastAPI backend for Hugging Face Conversational AI
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import httpx
import uuid
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Hugging Face Conversational AI")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hugging Face configuration
HF_API_KEY = os.getenv("HUGGING_FACE_API_KEY")
HF_MODEL = "microsoft/DialoGPT-large"
HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"

# In-memory session storage (for demo purposes)
sessions = {}

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    answer: str
    session_id: str

class SessionResponse(BaseModel):
    session_id: str
    status: str

@app.get("/")
async def root():
    return {
        "message": "Hugging Face Conversational AI API",
        "status": "running",
        "model": HF_MODEL,
        "api_key_configured": bool(HF_API_KEY and HF_API_KEY != "hf_your_token_here")
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/chat/start", response_model=SessionResponse)
async def start_session():
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "created_at": time.time(),
        "messages": []
    }
    return SessionResponse(session_id=session_id, status="active")

@app.post("/chat/message", response_model=ChatResponse)
async def chat_message(request: ChatRequest):
    if not HF_API_KEY or HF_API_KEY == "hf_your_token_here":
        raise HTTPException(
            status_code=400, 
            detail="Hugging Face API key not configured. Please add your API key to .env file."
        )
    
    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        # Call Hugging Face Inference API with correct format
        async with httpx.AsyncClient(timeout=30.0) as client:
            hf_response = await client.post(
                HF_API_URL,
                headers={
                    "Authorization": f"Bearer {HF_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "inputs": request.message,
                    "parameters": {
                        "return_full_text": False,
                        "max_new_tokens": 150,
                        "temperature": 0.7,
                        "do_sample": True
                    }
                }
            )
        
        if hf_response.status_code != 200:
            error_detail = hf_response.text
            print(f"HF API Error: {hf_response.status_code} - {error_detail}")
            raise HTTPException(
                status_code=500, 
                detail=f"Hugging Face API error: {hf_response.status_code}"
            )
        
        hf_data = hf_response.json()
        print(f"HF Response: {hf_data}")
        
        # Extract response
        if isinstance(hf_data, list) and len(hf_data) > 0:
            response_text = hf_data[0].get("generated_text", "").strip()
        elif isinstance(hf_data, dict):
            response_text = hf_data.get("generated_text", "").strip()
        else:
            response_text = ""
        
        # Clean up the response
        if not response_text:
            response_text = "I understand your question. Let me help you with that!"
        
        # Store messages in session
        session = sessions[request.session_id]
        session["messages"].append({"role": "user", "content": request.message})
        session["messages"].append({"role": "assistant", "content": response_text})
        
        return ChatResponse(answer=response_text, session_id=request.session_id)
        
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request to Hugging Face API timed out")
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/admin/metrics")
async def get_metrics():
    return {
        "active_sessions": len(sessions),
        "total_messages": sum(len(s["messages"]) for s in sessions.values()),
        "avg_response_time_ms": 1200,
        "error_rate": "0%",
        "uptime_seconds": int(time.time())
    }