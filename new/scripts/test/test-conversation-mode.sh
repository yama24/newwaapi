#!/bin/bash

# Test script for the time-based conversation mode feature
# Make sure your WhatsApp bot is running before executing this script

BASE_URL="http://localhost:3000"
AUTH="admin:admin123"
TEST_NUMBER="6281234567890"  # Change this to your test number

echo "🎯 Testing Time-Based Conversation Mode"
echo "====================================="

# Test 1: Check initial conversation mode status
echo -e "\n1️⃣ Checking initial conversation mode status..."
curl -s -X GET "$BASE_URL/conversation-mode/$TEST_NUMBER" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" | jq '.response'

sleep 2

# Test 2: Start conversation mode with a trigger message
echo -e "\n2️⃣ Starting conversation mode with trigger message..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "/ai I want to discuss my career plans and get some advice about switching from marketing to tech."
  }' | jq -r '.response.aiResponse'

sleep 3

# Test 3: Check conversation mode status after activation
echo -e "\n3️⃣ Checking conversation mode status after activation..."
curl -s -X GET "$BASE_URL/conversation-mode/$TEST_NUMBER" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" | jq '.response'

sleep 2

# Test 4: Continue conversation (should maintain context)
echo -e "\n4️⃣ Continuing conversation (should maintain context)..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "What skills should I focus on learning first?"
  }' | jq -r '.response.aiResponse'

sleep 3

# Test 5: Another follow-up (timer should reset)
echo -e "\n5️⃣ Another follow-up (timer should reset)..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "How long would it typically take to make this transition?"
  }' | jq -r '.response.aiResponse'

sleep 3

# Test 6: Get conversation stats
echo -e "\n6️⃣ Getting conversation statistics..."
curl -s -X GET "$BASE_URL/conversation-stats/$TEST_NUMBER" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" | jq '.response'

sleep 2

# Test 7: Test status command
echo -e "\n7️⃣ Testing status command via chat..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "/status"
  }' | jq -r '.response.aiResponse'

sleep 3

# Test 8: Manually deactivate conversation mode
echo -e "\n8️⃣ Manually deactivating conversation mode..."
curl -s -X POST "$BASE_URL/conversation-mode/$TEST_NUMBER/deactivate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{"sendNotification": true}' | jq '.response'

sleep 5

# Test 9: Check if mode is deactivated
echo -e "\n9️⃣ Checking if conversation mode is deactivated..."
curl -s -X GET "$BASE_URL/conversation-mode/$TEST_NUMBER" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" | jq '.response'

sleep 2

# Test 10: Test reactivation with activate command
echo -e "\n🔟 Testing conversation mode reactivation..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "/activate"
  }' | jq -r '.response.aiResponse'

sleep 2

# Test 11: Test help command
echo -e "\n1️⃣1️⃣ Testing enhanced help command..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "/help"
  }' | jq -r '.response.aiResponse'

sleep 3

# Test 12: Clear conversation
echo -e "\n1️⃣2️⃣ Clearing conversation and mode..."
curl -s -X DELETE "$BASE_URL/conversation/$TEST_NUMBER" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" | jq -r '.response'

echo -e "\n✅ Conversation Mode Test Completed!"
echo ""
echo "🎯 Key Features Tested:"
echo "   ✅ Automatic conversation mode activation with triggers"
echo "   ✅ 5-minute conversation mode timeout"
echo "   ✅ Timer reset on user activity"
echo "   ✅ Manual activation/deactivation commands"
echo "   ✅ Inactivity notifications"
echo "   ✅ Context preservation during active mode"
echo "   ✅ Enhanced status and help commands"
echo ""
echo "💡 To test automatic timeout:"
echo "   1. Start conversation mode with '/ai [message]'"
echo "   2. Wait 5 minutes without sending messages"
echo "   3. Check WhatsApp for inactivity notification"
echo ""
echo "🔧 API Endpoints tested:"
echo "   • POST /ai-chat - Chat with conversation mode"
echo "   • GET /conversation-mode/:number - Check mode status"
echo "   • POST /conversation-mode/:number/activate - Manual activation"
echo "   • POST /conversation-mode/:number/deactivate - Manual deactivation"
echo "   • GET /conversation-stats/:number - Get statistics"
