#!/bin/bash

# AI Chatbot Test Script
# This script demonstrates the AI chatbot functionality

echo "🤖 WhatsApp AI Chatbot Test Script"
echo "=================================="
echo ""

# Check if server is running
if ! curl -s http://localhost:3000/info > /dev/null; then
    echo "❌ Server is not running. Please start the server first:"
    echo "   npm start"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Get bot info
echo "📱 Getting bot information..."
curl -s http://localhost:3000/info | jq '.' || echo "Server running but may not be fully initialized yet"
echo ""

# Read user input for phone number
read -p "📞 Enter test phone number (e.g., 628123456789): " PHONE_NUMBER

if [ -z "$PHONE_NUMBER" ]; then
    echo "❌ Phone number is required"
    exit 1
fi

echo ""
echo "🧪 Testing AI Chat Endpoint..."
echo "Sending message: 'Hello, tell me a fun fact about space'"

# Test AI chat endpoint
RESPONSE=$(curl -s -X POST http://localhost:3000/ai-chat \
    -H "Content-Type: application/json" \
    -d "{
        \"number\": \"$PHONE_NUMBER\",
        \"message\": \"Hello, tell me a fun fact about space\"
    }")

echo ""
echo "📡 Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "🎯 Testing different AI prompts..."

# Array of test messages
messages=(
    "What is machine learning?"
    "Tell me a joke about programming"
    "How do I make coffee?"
    "Explain quantum physics simply"
    "What's the weather like today?"
)

for msg in "${messages[@]}"; do
    echo ""
    echo "💬 Testing: '$msg'"
    
    RESPONSE=$(curl -s -X POST http://localhost:3000/ai-chat \
        -H "Content-Type: application/json" \
        -d "{
            \"number\": \"$PHONE_NUMBER\",
            \"message\": \"$msg\"
        }")
    
    AI_RESPONSE=$(echo "$RESPONSE" | jq -r '.response.aiResponse' 2>/dev/null)
    
    if [ "$AI_RESPONSE" != "null" ] && [ "$AI_RESPONSE" != "" ]; then
        echo "🤖 AI: ${AI_RESPONSE:0:100}..."
    else
        echo "❌ Error: $(echo "$RESPONSE" | jq -r '.response' 2>/dev/null || echo "$RESPONSE")"
    fi
    
    # Small delay between requests
    sleep 2
done

echo ""
echo "✅ AI chatbot testing completed!"
echo ""
echo "💡 Tips:"
echo "   • Make sure your Google AI API key is configured in config.json"
echo "   • Check the console output for any error messages"
echo "   • Try sending '/ai hello' to your WhatsApp bot for automatic responses"
echo "   • Use '/bot', '/help', or '/ask' as triggers too"
