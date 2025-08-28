#!/bin/bash

# Test script for the enhanced AI chatbot with conversation context
# Make sure your WhatsApp bot is running before executing this script

BASE_URL="http://localhost:3000"
AUTH="admin:admin123"
TEST_NUMBER="6281234567890"  # Change this to your test number

echo "🧪 Testing Enhanced AI Chatbot with Conversation Context"
echo "=================================================="

# Test 1: Start a conversation
echo -e "\n1️⃣ Starting a conversation..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "/ai Hello! My name is John and I work as a software developer."
  }' | jq -r '.response.aiResponse'

sleep 3

# Test 2: Continue conversation with context
echo -e "\n2️⃣ Continuing conversation (should remember name)..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "What programming languages should I learn next?"
  }' | jq -r '.response.aiResponse'

sleep 3

# Test 3: Ask about previous context
echo -e "\n3️⃣ Testing context memory..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "What did I tell you my name was?"
  }' | jq -r '.response.aiResponse'

sleep 3

# Test 4: Get conversation stats
echo -e "\n4️⃣ Getting conversation statistics..."
curl -s -X GET "$BASE_URL/conversation-stats/$TEST_NUMBER" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" | jq '.response'

sleep 2

# Test 5: Get conversation history
echo -e "\n5️⃣ Getting conversation history..."
curl -s -X GET "$BASE_URL/conversation-history/$TEST_NUMBER" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" | jq '.response'

sleep 2

# Test 6: Test help command
echo -e "\n6️⃣ Testing help command..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "/help"
  }' | jq -r '.response.aiResponse'

sleep 3

# Test 7: Test status command
echo -e "\n7️⃣ Testing status command..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "/status"
  }' | jq -r '.response.aiResponse'

sleep 3

# Test 8: Clear conversation
echo -e "\n8️⃣ Clearing conversation..."
curl -s -X DELETE "$BASE_URL/conversation/$TEST_NUMBER" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" | jq -r '.response'

sleep 2

# Test 9: Test if context is cleared
echo -e "\n9️⃣ Testing if context was cleared (should not remember name)..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "Do you remember my name?"
  }' | jq -r '.response.aiResponse'

sleep 2

# Test 10: List all conversations
echo -e "\n🔟 Listing all active conversations..."
curl -s -X GET "$BASE_URL/conversations" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" | jq '.response'

echo -e "\n✅ Test completed! Check the responses above to verify the AI remembers context correctly."
echo "💡 The AI should:"
echo "   • Remember your name from the first message"
echo "   • Provide relevant programming advice based on your job"
echo "   • Respond to commands like /help and /status"
echo "   • Forget your name after conversation reset"
