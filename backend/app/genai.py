# Example: Using Hugging Face Transformers locally
from transformers import pipeline
from transformers import AutoModelForCausalLM, AutoTokenizer
import os
import asyncio

token = os.environ.get("HUGGINGFACE_TOKEN")
model_name = "mistralai/Mistral-7B-Instruct-v0.2"

tokenizer = AutoTokenizer.from_pretrained(model_name, use_auth_token=token)
model = AutoModelForCausalLM.from_pretrained(model_name, use_auth_token=token)

chatbot = pipeline("text-generation", model=model, tokenizer=tokenizer)

async def get_ai_response(message, context):
    prompt = f"Context: {context}\nUser: {message}\nAI:"

    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None,
        lambda: chatbot(prompt, max_new_tokens=120, temperature=0.3)
    )
    return result[0]['generated_text']