# AI Chatbot Setup Guide

## Quick Setup

### 1. Get Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" and create a new key
4. Copy your API key

### 2. Configure the Bot

Edit your `config.json`:

```json
{
  "features": {
    "chatbot": true,
    "autoReply": true
  },
  "googleAI": {
    "apiKey": "YOUR_ACTUAL_API_KEY_HERE",
    "model": "gemini-1.5-flash",
    "maxTokens": 1000,
    "temperature": 0.7,
    "systemPrompt": "You are a helpful WhatsApp AI assistant. Keep responses concise and friendly. You can help with general questions, provide information, and have conversations. Respond in the same language the user is speaking."
  }
}
```

### 3. Start the Bot

```bash
npm start
```

## Usage Examples

### Automatic Responses

When someone sends these messages to your WhatsApp bot:

**AI Triggers (always respond):**
- `/ai What's the capital of France?`
- `/bot How are you today?`
- `/help I need assistance`
- `/ask Tell me a joke`

**Questions (when autoReply is enabled):**
- `What's the weather like?`
- `How do I cook pasta?`
- `Can you help me?`

### API Usage

Send AI chat requests via API:

```bash
# Basic AI chat
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "number": "628123456789",
    "message": "Write a short poem about programming"
  }'

# With authentication
curl -X POST http://localhost:3000/ai-chat \
  -u "admin:admin123" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "628123456789",
    "message": "Explain machine learning in simple terms"
  }'
```

## Customization

### System Prompts

Customize the AI's behavior by modifying the `systemPrompt`:

```json
{
  "googleAI": {
    "systemPrompt": "You are a customer service AI for TechCorp. Be professional, helpful, and always mention our 24/7 support. Keep responses under 100 words."
  }
}
```

### Response Triggers

Modify the `shouldTriggerAI` function in `index.js` to add custom triggers:

```javascript
// Add more triggers
const aiTriggers = [
  '/ai', '/bot', '/help', '/ask', 
  '/support', '/info', '/faq'
]

// Add custom conditions
const isCustomTrigger = messageText.toLowerCase().includes('tech support')
return hasAITrigger || (doReplies && isQuestion) || isCustomTrigger
```

### Model Options

Available Gemini models:
- `gemini-1.5-flash`: Fast responses, good for most use cases
- `gemini-1.5-pro`: More capable, slower responses

### Temperature Settings

- `0.0`: Very focused and deterministic responses
- `0.3`: Balanced, slightly creative
- `0.7`: More creative and varied (default)
- `1.0`: Very creative, might be unpredictable

## Troubleshooting

### Common Issues

**AI not responding:**
1. Check if `chatbot: true` in config
2. Verify API key is correct
3. Check console for error messages

**API quota exceeded:**
1. Check your Google AI Studio usage
2. Upgrade your plan if needed
3. Reduce `maxTokens` to save quota

**Responses too long:**
1. Reduce `maxTokens` value
2. Update `systemPrompt` to request shorter responses

### Debug Logs

Check console output for AI status:
- ✅ Google AI chatbot initialized successfully
- ⚠️ Google AI chatbot disabled or API key not configured
- 🤖 AI Response generated for [number]
- ❌ Error generating AI response

## Security Notes

- Keep your API key secure and never commit it to version control
- Use environment variables for production deployments
- Consider rate limiting for public-facing APIs
- Monitor API usage to avoid unexpected charges

## Cost Optimization

- Use `gemini-1.5-flash` for most use cases (cheaper)
- Set reasonable `maxTokens` limits
- Implement smart triggers to avoid unnecessary API calls
- Cache frequent responses if applicable
