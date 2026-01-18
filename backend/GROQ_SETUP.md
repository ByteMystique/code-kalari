# Groq Whisper API Setup

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure API Key
The `.env` file already contains your Groq API key:
```
GROQ_API_KEY=gsk_...
```

### 3. Restart Backend
Stop the current server (Ctrl+C in the terminal running `python app.py`) and restart:
```bash
cd backend
python app.py
```

## What Changed?

- ✅ **Faster transcription** - Using Groq's optimized Whisper API (20-50x realtime)
- ✅ **Simpler setup** - No need for local Whisper models
- ✅ **Better reliability** - Cloud-based processing

## Testing

1. Start the backend server
2. Open YouTube in Chrome with the extension loaded
3. Enable the sign language overlay
4. The transcription will now use Groq's API

## Troubleshooting

If you see errors about missing dependencies:
```bash
pip install groq python-dotenv
```

If transcription fails, check the console logs for Groq API errors.
