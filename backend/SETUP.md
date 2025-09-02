# Backend Setup Guide

## 🔐 Secure API Key Setup

### Step 1: Copy Environment Template
```bash
cd backend
cp .env.example .env
```

### Step 2: Add Your OpenAI API Key
Edit `backend/.env` and replace the placeholder:
```env
OPENAI_API_KEY=sk-your_actual_openai_api_key_here
OPENAI_PROJECT_ID=proj-your_project_id_here
LLM_PROVIDER=openai
```

### Step 3: Verify Security
- ✅ `.env` is in `.gitignore` 
- ✅ Only `.env.example` gets committed
- ✅ Your actual API key stays local

### Step 4: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 5: Start Backend
```bash
python run.py
```

## 🔒 Security Best Practices

1. **Never commit `.env` files** - They contain secrets
2. **Use `.env.example`** - Template for other developers
3. **Rotate API keys regularly** - Good security hygiene
4. **Use different keys** - For development vs production

## 🚀 Alternative LLM Providers

### Ollama (Local, Free)
```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

### Mock Mode (Development)
```env
LLM_PROVIDER=mock
```

## 🔧 Troubleshooting

- **"OpenAI API key not configured"** → Check your `.env` file
- **"Failed to initialize OpenAI"** → Verify your API key is valid
- **Mock responses only** → Backend fell back due to API issues