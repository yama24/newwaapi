#!/bin/bash

# Test script for the simplified conversation mode
# Make sure your WhatsApp bot is running before executing this script

BASE_URL="http://localhost:3000"
AUTH="admin:admin123"
TEST_NUMBER="6281234567890"  # Change this to your test number

echo "💬 Testing Simplified Conversation Mode"
echo "======================================"

# Test 1: Clear any existing conversation
echo -e "\n1️⃣ Clearing any existing conversation..."
curl -s -X DELETE "$BASE_URL/conversation/$TEST_NUMBER" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" | jq -r '.response'

sleep 2

# Test 2: Check initial mode status (should be inactive)
echo -e "\n2️⃣ Checking initial conversation mode status..."
curl -s -X GET "$BASE_URL/conversation-mode/$TEST_NUMBER" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" | jq '.response'

sleep 2

# Test 3: Try regular message (should not trigger AI since mode is off)
echo -e "\n3️⃣ Sending regular message (should NOT trigger AI)..."
curl -s -X POST "$BASE_URL/send-message" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "Hello, how are you?"
  }' | jq -r '.status'

sleep 3

# Test 4: Activate conversation mode with /ai command
echo -e "\n4️⃣ Activating conversation mode with /ai command..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "/ai Hello! I want to start a conversation about learning programming."
  }' | jq -r '.response.aiResponse'

sleep 3

# Test 5: Check mode status after activation
echo -e "\n5️⃣ Checking conversation mode status after activation..."
curl -s -X GET "$BASE_URL/conversation-mode/$TEST_NUMBER" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" | jq '.response'

sleep 2

# Test 6: Send free message (should work now without commands)
echo -e "\n6️⃣ Sending free message in conversation mode..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "What programming language should I start with?"
  }' | jq -r '.response.aiResponse'

sleep 3

# Test 7: Another free message (should maintain context)
echo -e "\n7️⃣ Another free message (should maintain context)..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "Why is that a good choice for beginners?"
  }' | jq -r '.response.aiResponse'

sleep 3

# Test 8: Check conversation stats
echo -e "\n8️⃣ Checking conversation statistics..."
curl -s -X GET "$BASE_URL/conversation-stats/$TEST_NUMBER" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" | jq '.response'

sleep 2

# Test 9: Test /status command
echo -e "\n9️⃣ Testing /status command..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "/status"
  }' | jq -r '.response.aiResponse'

sleep 3

# Test 10: Test /help command
echo -e "\n🔟 Testing /help command..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "/help"
  }' | jq -r '.response.aiResponse'

sleep 3

# Test 11: Test manual deactivation
echo -e "\n1️⃣1️⃣ Testing manual deactivation..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "/deactivate"
  }' | jq -r '.response.aiResponse'

sleep 3

# Test 12: Try free message after deactivation (should not work)
echo -e "\n1️⃣2️⃣ Trying free message after deactivation (should not work)..."
echo "This should NOT trigger AI response (no command):"
curl -s -X POST "$BASE_URL/send-message" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "Are you still there?"
  }' | jq -r '.status'

sleep 3

# Test 13: Reactivate with just /activate
echo -e "\n1️⃣3️⃣ Reactivating with /activate command..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "/activate"
  }' | jq -r '.response.aiResponse'

sleep 3

# Test 14: Test free message after reactivation
echo -e "\n1️⃣4️⃣ Testing free message after reactivation..."
curl -s -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" \
  -d '{
    "number": "'$TEST_NUMBER'",
    "message": "Now I can chat freely again!"
  }' | jq -r '.response.aiResponse'

sleep 3

# Test 15: Final cleanup
echo -e "\n1️⃣5️⃣ Final cleanup..."
curl -s -X DELETE "$BASE_URL/conversation/$TEST_NUMBER" \
  -H "Authorization: Basic $(echo -n $AUTH | base64)" | jq -r '.response'

echo -e "\n✅ Simplified Conversation Mode Test Completed!"
echo ""
echo "🎯 Key Features Tested:"
echo "   ✅ One-time activation with /ai or /activate"
echo "   ✅ Free conversation without commands after activation"
echo "   ✅ Context preservation during conversation"
echo "   ✅ Manual deactivation with /deactivate"
echo "   ✅ No AI response to regular messages when mode is off"
echo "   ✅ Command-based controls (/status, /help, etc.)"
echo ""
echo "💡 How it works:"
echo "   1. User activates once with /ai [message] or /activate"
echo "   2. User can then chat freely without any commands"
echo "   3. Mode will auto-deactivate after 5 min of no user response to bot"
echo "   4. User gets notified when mode deactivates"
echo ""
echo "🧪 To test 5-minute timeout:"
echo "   1. Activate conversation mode with /ai"
echo "   2. Wait for AI response"
echo "   3. Don't reply for 5 minutes"
echo "   4. Check WhatsApp for auto-deactivation notification"
