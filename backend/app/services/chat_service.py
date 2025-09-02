"""
AI Chat service with OpenAI integration and fallback responses
"""

import os
import time
import random
from typing import List, Dict, Any
from openai import AsyncOpenAI

class ChatService:
    """Handles AI chat interactions with OpenAI and fallback responses"""
    
    def __init__(self, session_service, metrics_service):
        self.session_service = session_service
        self.metrics_service = metrics_service
        
        # Initialize OpenAI client if API key is available
        self.openai_client = None
        openai_api_key = os.getenv("OPENAI_API_KEY")
        
        if openai_api_key and openai_api_key != "your_openai_api_key_here":
            try:
                self.openai_client = AsyncOpenAI(api_key=openai_api_key)
                print("✅ OpenAI client initialized")
            except Exception as e:
                print(f"❌ Failed to initialize OpenAI client: {e}")
                self.openai_client = None
        else:
            print("ℹ️  OpenAI API key not provided, using mock responses")
    
    async def process_message(self, session_id: str, message: str) -> str:
        """Process a user message and return AI response"""
        start_time = time.time()
        success = True
        
        try:
            # Add user message to context
            await self.session_service.add_message_to_context(session_id, "user", message)
            
            # Get AI response
            if self.openai_client:
                response = await self._get_openai_response(session_id, message)
            else:
                response = await self._get_mock_response(message)
            
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
    
    async def _get_openai_response(self, session_id: str, message: str) -> str:
        """Get response from OpenAI API"""
        try:
            # Get conversation context
            context = await self.session_service.get_context(session_id)
            
            # Prepare messages for OpenAI
            messages = [
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant. Be friendly, informative, and concise in your responses. If asked about technical support, provide helpful guidance. Keep responses under 200 words unless more detail is specifically requested."
                }
            ]
            
            # Add conversation history (last 10 messages to stay within token limits)
            for ctx_message in context[-10:]:
                messages.append({
                    "role": ctx_message["role"],
                    "content": ctx_message["content"]
                })
            
            # Get response from OpenAI
            response = await self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=300,
                temperature=0.7,
                top_p=1,
                frequency_penalty=0,
                presence_penalty=0
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"OpenAI API error: {e}")
            # Fallback to mock response
            return await self._get_mock_response(message)
    
    async def _get_mock_response(self, message: str) -> str:
        """Generate mock AI responses for development/fallback"""
        message_lower = message.lower()
        
        # Simulate processing time
        await self._simulate_processing_time()
        
        # Context-aware responses
        responses = {
            # Greetings
            "hello": [
                "Hello! I'm your AI assistant. How can I help you today?",
                "Hi there! What can I assist you with?",
                "Hello! I'm here to help. What would you like to know?"
            ],
            "hi": [
                "Hi! How can I assist you today?",
                "Hello! What can I help you with?",
                "Hi there! I'm ready to help."
            ],
            
            # Help and capabilities
            "help": [
                "I can help you with:\n• Answering questions\n• Providing explanations\n• Technical support\n• General conversation\n\nWhat would you like assistance with?",
                "I'm here to assist! I can answer questions, explain concepts, help with problems, and have conversations. What do you need help with?",
                "I can help with various tasks including answering questions, providing information, and offering support. How can I assist you today?"
            ],
            "what can you do": [
                "I'm an AI assistant capable of:\n• Answering questions on various topics\n• Providing explanations and tutorials\n• Helping with problem-solving\n• Technical support\n• General conversation\n\nWhat would you like to explore?",
                "I can assist with many things! I can answer questions, explain concepts, help solve problems, provide technical support, and engage in meaningful conversations. What interests you?"
            ],
            "capabilities": [
                "My capabilities include:\n• Knowledge Q&A\n• Technical explanations\n• Problem-solving assistance\n• Support and guidance\n• Interactive conversations\n\nFeel free to ask me anything!",
                "I can help with a wide range of tasks including answering questions, providing detailed explanations, offering technical support, and having engaging conversations. What would you like to try?"
            ],
            
            # Technical support
            "support": [
                "I'm here to provide technical support! Please describe the issue you're experiencing, and I'll do my best to help you resolve it.",
                "Technical support is one of my specialties. What problem are you facing? Please provide as much detail as possible.",
                "I'd be happy to help with technical support. What specific issue can I assist you with today?"
            ],
            "problem": [
                "I'm sorry to hear you're having a problem. Can you describe what's happening in more detail? I'll help you troubleshoot the issue.",
                "Let's work together to solve this problem. Please tell me more about what you're experiencing.",
                "I'm here to help resolve your problem. What specific issue are you encountering?"
            ],
            
            # Orders and business
            "order": [
                "I can help you with order-related questions! Are you looking to:\n• Track an existing order\n• Place a new order\n• Modify an order\n• Report an issue with an order\n\nPlease let me know what you need.",
                "For order assistance, I can help you track shipments, check order status, or address any concerns. What specific help do you need with your order?",
                "I'm here to help with your order! Whether you need to track a package, check status, or resolve an issue, I can assist. What do you need?"
            ],
            "refund": [
                "I can help you with refund requests. To process a refund, I'll need:\n• Your order number\n• Reason for the refund\n• Any relevant details\n\nRefunds are typically processed within 3-5 business days. What's your order number?",
                "For refund assistance, please provide your order details and the reason for the refund request. I'll guide you through the process.",
                "I can help process your refund request. Please share your order information and let me know why you'd like a refund."
            ],
            
            # Thanks and positive
            "thank": [
                "You're very welcome! I'm glad I could help. Is there anything else you'd like to know?",
                "Happy to help! Feel free to ask if you have any other questions.",
                "You're welcome! I'm here whenever you need assistance."
            ],
            "good": [
                "I'm glad that was helpful! Is there anything else I can assist you with?",
                "Great! I'm happy I could help. Let me know if you need anything else.",
                "Wonderful! Feel free to ask if you have more questions."
            ]
        }
        
        # Find matching response category
        for keyword, response_list in responses.items():
            if keyword in message_lower:
                return random.choice(response_list)
        
        # Default responses for unmatched queries
        default_responses = [
            f"That's an interesting question about '{message}'. While I don't have a specific answer for that right now, I'm here to help with various topics. Could you provide more context or ask about something else?",
            f"I understand you're asking about '{message}'. I'd be happy to help! Could you provide a bit more detail about what specifically you'd like to know?",
            f"Thanks for your question about '{message}'. To give you the best answer, could you tell me more about what you're looking for?",
            "I'm not sure I fully understand your question, but I'm here to help! Could you rephrase it or provide more details?",
            "That's a great question! While I might not have all the details on that specific topic, I'm happy to help in other ways. What else can I assist you with?"
        ]
        
        return random.choice(default_responses)
    
    async def _simulate_processing_time(self):
        """Simulate realistic AI processing time"""
        # Random delay between 0.3 and 1.5 seconds
        delay = random.uniform(0.3, 1.5)
        await self._sleep(delay)
    
    async def _sleep(self, seconds: float):
        """Async sleep helper"""
        import asyncio
        await asyncio.sleep(seconds)