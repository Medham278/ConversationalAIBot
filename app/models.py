"""
Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ChatRequest(BaseModel):
    session_id: str = Field(..., description="Unique session identifier")
    message: str = Field(..., min_length=1, max_length=1000, description="User message")

class ChatResponse(BaseModel):
    answer: str = Field(..., description="AI response")
    session_id: str = Field(..., description="Session identifier")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now, description="Response timestamp")

class SessionResponse(BaseModel):
    session_id: str = Field(..., description="Unique session identifier")
    status: str = Field(..., description="Session status")
    message: str = Field(..., description="Status message")

class MetricsResponse(BaseModel):
    active_sessions: int = Field(..., description="Number of active sessions")
    total_messages: int = Field(..., description="Total messages processed")
    avg_response_time_ms: float = Field(..., description="Average response time in milliseconds")
    error_rate: str = Field(..., description="Error rate percentage")
    uptime_seconds: int = Field(..., description="Server uptime in seconds")