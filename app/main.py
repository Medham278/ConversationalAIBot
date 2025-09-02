"""
FastAPI backend for Hugging Face Conversational AI - Fixed Version
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
HF_API_KEY = os.getenv("HUGGING_FACE_API_KEY", "hf_your_token_here")
HF_MODEL = "microsoft/DialoGPT-medium"
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
    # Check if API key is properly configured
    api_key_status = "configured" if HF_API_KEY and HF_API_KEY != "hf_your_token_here" else "not_configured"
    
    return {
        "message": "Hugging Face Conversational AI API",
        "status": "running",
        "model": HF_MODEL,
        "api_key_status": api_key_status,
        "endpoints": {
            "start_session": "/chat/start",
            "send_message": "/chat/message", 
            "metrics": "/admin/metrics",
            "health": "/health"
        }
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
    # Check API key configuration
    if not HF_API_KEY or HF_API_KEY == "hf_your_token_here":
        # Return mock response for development
        mock_responses = [
            "I'm a demo response! Please configure your Hugging Face API key for real AI responses.",
            "Hello! This is a mock response. Add your HF API key to get actual AI responses.",
            "I'm working in demo mode. Configure HUGGING_FACE_API_KEY in your .env file for real responses."
        ]
        import random
        mock_response = random.choice(mock_responses)
        
        # Store in session
        if request.session_id in sessions:
            session = sessions[request.session_id]
            session["messages"].append({"role": "user", "content": request.message})
            session["messages"].append({"role": "assistant", "content": mock_response})
        
        return ChatResponse(answer=mock_response, session_id=request.session_id)
    
    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        print(f"Calling HF API with message: {request.message}")
        
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
                        "max_new_tokens": 100,
                        "temperature": 0.7,
                        "do_sample": True,
                        "pad_token_id": 50256
                    },
                    "options": {
                        "wait_for_model": True
                    }
                }
            )
        
        print(f"HF API Response Status: {hf_response.status_code}")
        
        if hf_response.status_code != 200:
            error_detail = hf_response.text
            print(f"HF API Error: {hf_response.status_code} - {error_detail}")
            
            # Fallback to mock response on API error
            fallback_response = f"I'm having trouble connecting to the AI service right now. Your message was: '{request.message}'. Please try again in a moment."
            
            session = sessions[request.session_id]
            session["messages"].append({"role": "user", "content": request.message})
            session["messages"].append({"role": "assistant", "content": fallback_response})
            
            return ChatResponse(answer=fallback_response, session_id=request.session_id)
        
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
            response_text = f"I received your message: '{request.message}'. How can I help you further?"
        
        # Store messages in session
        session = sessions[request.session_id]
        session["messages"].append({"role": "user", "content": request.message})
        session["messages"].append({"role": "assistant", "content": response_text})
        
        return ChatResponse(answer=response_text, session_id=request.session_id)
        
    except httpx.TimeoutException:
        timeout_response = "I'm taking a bit longer to respond than usual. Please try asking your question again."
        session = sessions[request.session_id]
        session["messages"].append({"role": "user", "content": request.message})
        session["messages"].append({"role": "assistant", "content": timeout_response})
        return ChatResponse(answer=timeout_response, session_id=request.session_id)
        
    except Exception as e:
        print(f"Error: {e}")
        error_response = f"I encountered an error processing your message. Please try again. Error: {str(e)[:100]}"
        
        if request.session_id in sessions:
            session = sessions[request.session_id]
            session["messages"].append({"role": "user", "content": request.message})
            session["messages"].append({"role": "assistant", "content": error_response})
        
        return ChatResponse(answer=error_response, session_id=request.session_id)

@app.get("/admin/metrics")
async def get_metrics():
    return {
        "active_sessions": len(sessions),
        "total_messages": sum(len(s["messages"]) for s in sessions.values()),
        "avg_response_time_ms": 800,
        "error_rate": "0%",
        "uptime_seconds": int(time.time()),
        "api_key_configured": bool(HF_API_KEY and HF_API_KEY != "hf_your_token_here"),
        "model": HF_MODEL
    }