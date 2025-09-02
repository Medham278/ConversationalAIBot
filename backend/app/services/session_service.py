"""
Session management service
"""

import uuid
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

class SessionService:
    """Manages chat sessions with Redis storage"""
    
    def __init__(self, redis_client):
        self.redis = redis_client
        self.session_ttl = 3600  # 1 hour
    
    async def create_session(self) -> str:
        """Create a new chat session"""
        session_id = str(uuid.uuid4())
        session_data = {
            "id": session_id,
            "created_at": datetime.now().isoformat(),
            "last_activity": datetime.now().isoformat(),
            "message_count": 0,
            "context": []
        }
        
        await self.redis.set(
            f"session:{session_id}",
            json.dumps(session_data),
            ex=self.session_ttl
        )
        
        return session_id
    
    async def get_session(self, session_id: str) -> Optional[Dict[Any, Any]]:
        """Get session data"""
        data = await self.redis.get(f"session:{session_id}")
        if data:
            return json.loads(data)
        return None
    
    async def update_session(self, session_id: str, updates: Dict[Any, Any]) -> bool:
        """Update session data"""
        session_data = await self.get_session(session_id)
        if not session_data:
            return False
        
        session_data.update(updates)
        session_data["last_activity"] = datetime.now().isoformat()
        
        await self.redis.set(
            f"session:{session_id}",
            json.dumps(session_data),
            ex=self.session_ttl
        )
        return True
    
    async def add_message_to_context(self, session_id: str, role: str, content: str) -> bool:
        """Add a message to session context"""
        session_data = await self.get_session(session_id)
        if not session_data:
            return False
        
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
        
        session_data["context"].append(message)
        session_data["message_count"] += 1
        
        # Keep only last 20 messages to prevent context from growing too large
        if len(session_data["context"]) > 20:
            session_data["context"] = session_data["context"][-20:]
        
        return await self.update_session(session_id, session_data)
    
    async def get_context(self, session_id: str) -> list:
        """Get conversation context for a session"""
        session_data = await self.get_session(session_id)
        if session_data:
            return session_data.get("context", [])
        return []
    
    async def session_exists(self, session_id: str) -> bool:
        """Check if session exists"""
        exists = await self.redis.exists(f"session:{session_id}")
        return bool(exists)
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a session"""
        deleted = await self.redis.delete(f"session:{session_id}")
        return bool(deleted)
    
    async def extend_session(self, session_id: str) -> bool:
        """Extend session TTL"""
        session_data = await self.get_session(session_id)
        if session_data:
            await self.redis.set(
                f"session:{session_id}",
                json.dumps(session_data),
                ex=self.session_ttl
            )
            return True
        return False