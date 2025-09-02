"""
LLM service with multiple provider support
"""

import os
import httpx
import json
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI

class LLMService:
    """Handles LLM interactions with multiple providers"""
    
    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "mock").lower()
        self.openai_client = None
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "llama2")
        
        # Initialize OpenAI if configured
        if self.provider == "openai":
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if openai_api_key and openai_api_key != "your_openai_api_key_here":
                try:
                    self.openai_client = AsyncOpenAI(api_key=openai_api_key)
                    print("✅ OpenAI client initialized")
                except Exception as e:
                    print(f"❌ Failed to initialize OpenAI: {e}")
                    self.provider = "mock"
            else:
                print("⚠️  OpenAI API key not configured, falling back to mock")
                self.provider = "mock"
        
        print(f"🤖 LLM Provider: {self.provider}")
    
    async def generate_response(self, messages: List[Dict[str, str]], context: Optional[str] = None) -> str:
        """Generate response using configured LLM provider"""
        
        if self.provider == "openai" and self.openai_client:
            return await self._openai_response(messages, context)
        elif self.provider == "ollama":
            return await self._ollama_response(messages, context)
        else:
            return await self._mock_response(messages[-1]["content"] if messages else "")
    
    async def _openai_response(self, messages: List[Dict[str, str]], context: Optional[str] = None) -> str:
        """Generate response using OpenAI"""
        try:
            # Prepare system message
            system_content = """You are a helpful AI assistant. Be friendly, informative, and concise. 
            Provide helpful responses while being conversational and engaging. Keep responses under 200 words unless more detail is requested."""
            
            if context:
                system_content += f"\n\nContext from previous conversation: {context}"
            
            # Prepare messages for OpenAI
            openai_messages = [{"role": "system", "content": system_content}]
            
            # Add conversation history (limit to last 10 messages)
            for msg in messages[-10:]:
                openai_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
            
            # Generate response
            response = await self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=openai_messages,
                max_tokens=300,
                temperature=0.7,
                top_p=1,
                frequency_penalty=0,
                presence_penalty=0
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return await self._mock_response(messages[-1]["content"] if messages else "")
    
    async def _ollama_response(self, messages: List[Dict[str, str]], context: Optional[str] = None) -> str:
        """Generate response using Ollama"""
        try:
            # Prepare prompt for Ollama
            prompt = "You are a helpful AI assistant. Be friendly and informative.\n\n"
            
            if context:
                prompt += f"Context: {context}\n\n"
            
            # Add conversation history
            for msg in messages[-5:]:  # Limit context for Ollama
                role = "Human" if msg["role"] == "user" else "Assistant"
                prompt += f"{role}: {msg['content']}\n"
            
            prompt += "Assistant:"
            
            # Make request to Ollama
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.ollama_base_url}/api/generate",
                    json={
                        "model": self.ollama_model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "max_tokens": 200
                        }
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("response", "").strip()
                else:
                    print(f"Ollama error: {response.status_code}")
                    return await self._mock_response(messages[-1]["content"] if messages else "")
                    
        except Exception as e:
            print(f"Ollama error: {e}")
            return await self._mock_response(messages[-1]["content"] if messages else "")
    
    async def _mock_response(self, message: str) -> str:
        """Generate mock response for development"""
        import random
        import asyncio
        
        # Simulate processing time
        await asyncio.sleep(random.uniform(0.5, 1.5))
        
        message_lower = message.lower()
        
        responses = {
            "hello": [
                "Hello! I'm your AI assistant. How can I help you today?",
                "Hi there! What can I assist you with?",
                "Hello! I'm here to help. What would you like to know?"
            ],
            "help": [
                "I can help you with:\n• Answering questions\n• Providing explanations\n• Technical support\n• General conversation\n\nWhat would you like assistance with?",
                "I'm here to assist! I can answer questions, explain concepts, help with problems, and have conversations. What do you need help with?"
            ],
            "capabilities": [
                "I'm an AI assistant with capabilities including:\n• Knowledge Q&A\n• Technical explanations\n• Problem-solving assistance\n• Support and guidance\n• Interactive conversations\n\nWhat would you like to explore?",
                "I can help with many things! I can answer questions, explain concepts, provide technical support, and engage in meaningful conversations."
            ],
            "weather": [
                "I don't have access to real-time weather data, but I'd be happy to help you find weather information or discuss weather-related topics!",
                "For current weather information, I'd recommend checking a weather service like Weather.com or your local weather app."
            ]
        }
        
        # Find matching response
        for keyword, response_list in responses.items():
            if keyword in message_lower:
                return random.choice(response_list)
        
        # Default responses
        default_responses = [
            f"That's an interesting question about '{message}'. I'd be happy to help! Could you provide more details about what you're looking for?",
            f"I understand you're asking about '{message}'. To give you the best answer, could you tell me more about what specifically you'd like to know?",
            "That's a great question! I'm here to help. Could you provide a bit more context so I can give you a more detailed response?",
            "I'm ready to assist with that! Could you elaborate on what you'd like to know or what specific help you need?"
        ]
        
        return random.choice(default_responses)