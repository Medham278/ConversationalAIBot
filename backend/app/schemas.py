# backend/app/schemas.py
"""
Schemas for the FastAPI chat application.
This module defines the data models used for request and response validation.
"""

from pydantic import BaseModel

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    answer: str
