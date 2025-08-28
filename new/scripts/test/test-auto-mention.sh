#!/bin/bash

echo "🧪 Testing Auto Mention Functionality..."
echo ""

# Test 1: Send message with mention to a group
echo "Test 1: Sending message with @mention to group"
curl -X POST http://localhost:3000/send-group-message \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:admin123' | base64)" \
  -d '{
    "id": "628986182128-1627374981@g.us",
    "message": "Hello @628986182128, how are you doing today? Also @6281292267204 please check this!"
  }' \
  -s | jq .

echo ""
echo "---"
echo ""

# Test 2: Send message to individual (mentions should not work)
echo "Test 2: Sending message with @mention to individual (should work normally)"
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:admin123' | base64)" \
  -d '{
    "number": "628986182128",
    "message": "Hi @628986182128, this mention will not work in individual chat"
  }' \
  -s | jq .

echo ""
echo "---"
echo ""

# Test 3: AI chat with mentions
echo "Test 3: AI chat with mentions"
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:admin123' | base64)" \
  -d '{
    "number": "628986182128-1627374981@g.us",
    "message": "Please mention @628986182128 in your response"
  }' \
  -s | jq .

echo ""
echo "✅ Auto mention test completed!"
echo ""
echo "ℹ️  How it works:"
echo "   • Detects @username patterns in messages"
echo "   • For groups: converts to WhatsApp mentions"
echo "   • For individuals: sends as regular text"
echo "   • Works in: send-message, send-group-message, ai-chat"
