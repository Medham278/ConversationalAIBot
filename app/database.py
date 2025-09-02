"""
Database connection and configuration
"""

import redis.asyncio as aioredis
import os
from typing import Optional

_redis_client: Optional[aioredis.Redis] = None

async def get_redis_client() -> aioredis.Redis:
    """Get Redis client instance"""
    global _redis_client
    
    if _redis_client is None:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        try:
            _redis_client = aioredis.from_url(
                redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True,
                socket_keepalive_options={},
                health_check_interval=30
            )
            # Test connection
            await _redis_client.ping()
            print(f"✅ Connected to Redis at {redis_url}")
        except Exception as e:
            print(f"❌ Failed to connect to Redis: {e}")
            print("🔄 Using in-memory fallback (data will not persist)")
            # For development, we'll create a mock Redis client
            _redis_client = MockRedisClient()
    
    return _redis_client

class MockRedisClient:
    """Mock Redis client for development when Redis is not available"""
    
    def __init__(self):
        self._data = {}
        self._counters = {}
    
    async def set(self, key: str, value: str, ex: Optional[int] = None):
        self._data[key] = value
        return True
    
    async def get(self, key: str) -> Optional[str]:
        return self._data.get(key)
    
    async def delete(self, key: str) -> int:
        if key in self._data:
            del self._data[key]
            return 1
        return 0
    
    async def exists(self, key: str) -> int:
        return 1 if key in self._data else 0
    
    async def incr(self, key: str) -> int:
        self._counters[key] = self._counters.get(key, 0) + 1
        return self._counters[key]
    
    async def decr(self, key: str) -> int:
        self._counters[key] = self._counters.get(key, 0) - 1
        return max(0, self._counters[key])
    
    async def ping(self):
        return True
    
    async def close(self):
        pass