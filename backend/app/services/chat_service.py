"""
AI Chat service with multiple LLM provider support
"""

import os
import time
from typing import List, Dict, Any
from .llm_service import LLMService

class ChatService:
    """Handles AI chat interactions with multiple LLM providers"""
    
    def __init__(self, session_service, metrics_service):
        self.session_service = session_service
        self.metrics_service = metrics_service
        self.llm_service = LLMService()
    
    async def process_message(self, session_id: str, message: str) -> str:
        """Process a user message and return AI response"""
        start_time = time.time()
        success = True
        
        try:
            # Add user message to context
            await self.session_service.add_message_to_context(session_id, "user", message)
            
            # Get conversation context
            context = await self.session_service.get_context(session_id)
            
            # Prepare messages for LLM
            messages = [{"role": msg["role"], "content": msg["content"]} for msg in context]
            
            # Get LLM response
            response = await self.llm_service.generate_response(messages)
            
            # Add AI response to context
            await self.session_service.add_message_to_context(session_id, "assistant", response)
            
            # Extend session TTL
            await self.session_service.extend_session(session_id)
            
        except Exception as e:
            print(f"Error processing message: {e}")
            response = "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment."
            success = False
        
        # Record metrics
        response_time_ms = (time.time() - start_time) * 1000
        await self.metrics_service.record_message(response_time_ms, success)
        
        return response