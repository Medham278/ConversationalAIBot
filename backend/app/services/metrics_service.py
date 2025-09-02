"""
Metrics collection and reporting service
"""

import time
import json
from datetime import datetime
from typing import Dict, Any

class MetricsService:
    """Collects and provides system metrics"""
    
    def __init__(self, redis_client):
        self.redis = redis_client
        self.start_time = time.time()
    
    async def increment_active_sessions(self):
        """Increment active session counter"""
        await self.redis.incr("metrics:active_sessions")
    
    async def decrement_active_sessions(self):
        """Decrement active session counter"""
        await self.redis.decr("metrics:active_sessions")
    
    async def record_message(self, response_time_ms: float, success: bool = True):
        """Record a message processing event"""
        await self.redis.incr("metrics:total_messages")
        
        if success:
            await self.redis.incr("metrics:successful_messages")
        else:
            await self.redis.incr("metrics:failed_messages")
        
        # Store response time for averaging
        response_times_key = "metrics:response_times"
        current_times = await self.redis.get(response_times_key)
        
        if current_times:
            times = json.loads(current_times)
        else:
            times = []
        
        times.append(response_time_ms)
        
        # Keep only last 100 response times
        if len(times) > 100:
            times = times[-100:]
        
        await self.redis.set(response_times_key, json.dumps(times))
    
    async def get_metrics(self) -> Dict[str, Any]:
        """Get current system metrics"""
        active_sessions = await self.redis.get("metrics:active_sessions") or "0"
        total_messages = await self.redis.get("metrics:total_messages") or "0"
        successful_messages = await self.redis.get("metrics:successful_messages") or "0"
        failed_messages = await self.redis.get("metrics:failed_messages") or "0"
        
        # Calculate average response time
        response_times_data = await self.redis.get("metrics:response_times")
        if response_times_data:
            response_times = json.loads(response_times_data)
            avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        else:
            avg_response_time = 0
        
        # Calculate error rate
        total_msg_count = int(total_messages)
        failed_msg_count = int(failed_messages)
        error_rate = (failed_msg_count / total_msg_count * 100) if total_msg_count > 0 else 0
        
        # Calculate uptime
        uptime_seconds = int(time.time() - self.start_time)
        
        return {
            "active_sessions": int(active_sessions),
            "total_messages": total_msg_count,
            "avg_response_time_ms": round(avg_response_time, 2),
            "error_rate": f"{error_rate:.1f}%",
            "uptime_seconds": uptime_seconds
        }
    
    async def reset_metrics(self):
        """Reset all metrics (for testing/admin purposes)"""
        keys_to_delete = [
            "metrics:active_sessions",
            "metrics:total_messages",
            "metrics:successful_messages",
            "metrics:failed_messages",
            "metrics:response_times"
        ]
        
        for key in keys_to_delete:
            await self.redis.delete(key)
        
        self.start_time = time.time()