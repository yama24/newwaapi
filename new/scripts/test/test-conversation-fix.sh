#!/bin/bash

echo "🧪 Testing AI Conversation History Fix..."
echo ""

# Test 1: Simple AI chat
echo "Test 1: Simple AI chat"
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:admin123' | base64)" \
  -d '{
    "number": "6281234567890",
    "message": "Halo, siapa namamu?"
  }' \
  -s | jq -r '.response'

echo ""
echo "---"
echo ""

# Test 2: Activate conversation mode
echo "Test 2: Activating conversation mode"
curl -X POST http://localhost:3000/conversation-mode/6281234567890/activate \
  -H "Authorization: Basic $(echo -n 'admin:admin123' | base64)" \
  -s | jq -r '.message'

echo ""

# Test 3: Follow-up message in conversation mode
echo "Test 3: Follow-up message in conversation mode"
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:admin123' | base64)" \
  -d '{
    "number": "6281234567890",
    "message": "Apa yang bisa kamu lakukan?"
  }' \
  -s | jq -r '.response'

echo ""
echo "✅ Conversation history test completed!"
