# backend/app/main.py
"""
Main application entry point for the FastAPI-based chat application.
This module initializes the FastAPI app, sets up routes, and handles session management.
"""

from fastapi import FastAPI, HTTPException, Request
from app.schemas import ChatRequest, ChatResponse
from app.genai import get_ai_response
from app.metrics import log_metrics
import redis.asyncio as aioredis
import uuid

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis = None  # We'll initialize in startup event

@app.on_event("startup")
async def startup():
    global redis
    redis = aioredis.Redis.from_url('redis://localhost')

@app.on_event("shutdown")
async def shutdown():
    await redis.close()

@app.post("/chat/start")
async def start_session():
    session_id = str(uuid.uuid4())
    await redis.set(f"session:{session_id}:context", "")
    return {"session_id": session_id}

@app.post("/chat/message")
async def chat_message(data: ChatRequest):
    # Retrieve session context
    value = await redis.get(f"session:{data.session_id}:context")
    if value is not None:
        context = value.decode("utf-8")
    else:
        context = None
    if context is None:
        raise HTTPException(status_code=404, detail="Session not found")
    # Call GenAI (mock or OpenAI)
    response = await get_ai_response(data.message, context)
    # Update context
    new_context = context + "\nUser: " + data.message + "\nAI: " + response
    await redis.set(f"session:{data.session_id}:context", new_context)
    # Log metrics (to file/db/etc.)
    log_metrics(data.session_id, data.message, response)
    return ChatResponse(answer=response)

@app.get("/admin/metrics")
async def get_metrics():
    # Aggregate metrics for admin dashboard
    # (For demo: active session count, avg response time, error rate)
    # We'll mock initially, then wire real metrics
    return {"active_sessions": 25, "avg_response_time_ms": 210, "error_rate": "1.2%"}
