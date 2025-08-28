#!/bin/bash

echo "🧪 Testing AI Chat Fix..."
echo ""

# Test the AI chat endpoint
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:admin123' | base64)" \
  -d '{
    "number": "6281234567890",
    "message": "Halo, apa kabar?"
  }' \
  -s | jq .

echo ""
echo "✅ AI Fix test completed!"
