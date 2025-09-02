"""
FastAPI backend for Conversational AI Bot
Provides chat endpoints, session management, and metrics
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.models import ChatRequest, ChatResponse, SessionResponse, MetricsResponse
from app.services.chat_service import ChatService
from app.services.session_service import SessionService
from app.services.metrics_service import MetricsService
from app.database import get_redis_client

# Load environment variables
load_dotenv()

# Global services
chat_service = None
session_service = None
metrics_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global chat_service, session_service, metrics_service
    
    # Initialize services
    redis_client = await get_redis_client()
    session_service = SessionService(redis_client)
    metrics_service = MetricsService(redis_client)
    chat_service = ChatService(session_service, metrics_service)
    
    print("🚀 FastAPI backend started successfully!")
    print("📡 Redis connection established")
    print("🤖 AI chat service initialized")
    
    yield
    
    # Cleanup
    if redis_client:
        await redis_client.close()
    print("🔄 Backend shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Conversational AI Bot API",
    description="Backend API for the conversational AI bot with session management and metrics",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Conversational AI Bot API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "api": "running",
            "redis": "connected" if session_service else "disconnected",
            "ai": "ready"
        }
    }

@app.post("/chat/start", response_model=SessionResponse)
async def start_chat_session():
    """Start a new chat session"""
    try:
        session_id = await session_service.create_session()
        await metrics_service.increment_active_sessions()
        
        return SessionResponse(
            session_id=session_id,
            status="active",
            message="Chat session started successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start session: {str(e)}")

@app.post("/chat/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """Send a message and get AI response"""
    try:
        # Validate session
        if not await session_service.session_exists(request.session_id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get AI response
        response = await chat_service.process_message(
            session_id=request.session_id,
            message=request.message
        )
        
        return ChatResponse(
            answer=response,
            session_id=request.session_id,
            timestamp=None  # Will be set by the model
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process message: {str(e)}")

@app.get("/admin/metrics", response_model=MetricsResponse)
async def get_metrics():
    """Get system metrics for admin dashboard"""
    try:
        metrics = await metrics_service.get_metrics()
        return MetricsResponse(**metrics)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get metrics: {str(e)}")

@app.delete("/chat/session/{session_id}")
async def end_session(session_id: str):
    """End a chat session"""
    try:
        if not await session_service.session_exists(session_id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        await session_service.delete_session(session_id)
        await metrics_service.decrement_active_sessions()
        
        return {"message": "Session ended successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to end session: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "True").lower() == "true"
    )