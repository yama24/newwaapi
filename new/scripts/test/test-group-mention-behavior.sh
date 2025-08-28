#!/bin/bash

# Test script for WhatsApp Group Mention Behavior
# Tests that bot only responds in groups when mentioned

echo "🧪 Testing WhatsApp Group Mention Behavior..."
echo "=================================================="

BASE_URL="http://localhost:3000"
GROUP_ID="628986182128-1627374981@g.us"  # Replace with actual group ID
BOT_NUMBER="6281234567890"  # Replace with actual bot number

echo ""
echo "📱 Test 1: Group message WITHOUT mention (should NOT respond)"
echo "------------------------------------------------------------"
curl -X POST "$BASE_URL/send-group-message" \
  -H "Content-Type: application/json" \
  -d "{
    \"groupId\": \"$GROUP_ID\",
    \"message\": \"Hello everyone, this is a test message without mention\"
  }" | jq .

echo ""
echo "📱 Test 2: Group message WITH mention (should respond)"
echo "------------------------------------------------------"
curl -X POST "$BASE_URL/send-group-message" \
  -H "Content-Type: application/json" \
  -d "{
    \"groupId\": \"$GROUP_ID\",
    \"message\": \"Hello @$BOT_NUMBER, can you help me?\",
    \"mentions\": [\"$BOT_NUMBER@s.whatsapp.net\"]
  }" | jq .

echo ""
echo "📱 Test 3: Group AI command WITH mention (should respond)"
echo "---------------------------------------------------------"
curl -X POST "$BASE_URL/send-group-message" \
  -H "Content-Type: application/json" \
  -d "{
    \"groupId\": \"$GROUP_ID\",
    \"message\": \"/ai @$BOT_NUMBER tell me a joke\",
    \"mentions\": [\"$BOT_NUMBER@s.whatsapp.net\"]
  }" | jq .

echo ""
echo "📱 Test 4: Group AI command WITHOUT mention (should NOT respond)"
echo "----------------------------------------------------------------"
curl -X POST "$BASE_URL/send-group-message" \
  -H "Content-Type: application/json" \
  -d "{
    \"groupId\": \"$GROUP_ID\",
    \"message\": \"/ai tell me a joke\"
  }" | jq .

echo ""
echo "📱 Test 5: Individual chat (should respond normally)"
echo "---------------------------------------------------"
INDIVIDUAL_ID="6281292267204@s.whatsapp.net"  # Replace with actual number
curl -X POST "$BASE_URL/send-message" \
  -H "Content-Type: application/json" \
  -d "{
    \"contactId\": \"$INDIVIDUAL_ID\",
    \"message\": \"Hello, this is a test message in individual chat\"
  }" | jq .

echo ""
echo "📱 Test 6: Individual AI command (should respond)"
echo "------------------------------------------------"
curl -X POST "$BASE_URL/ai-chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"contactId\": \"$INDIVIDUAL_ID\",
    \"message\": \"Tell me a joke\"
  }" | jq .

echo ""
echo "✅ Group Mention Behavior Tests Completed!"
echo ""
echo "📋 Expected Results:"
echo "- Test 1: Group message without mention → No AI response"
echo "- Test 2: Group message with mention → Should get response"  
echo "- Test 3: Group AI command with mention → Should get AI response"
echo "- Test 4: Group AI command without mention → No AI response"
echo "- Test 5: Individual chat → Should get response (normal behavior)"
echo "- Test 6: Individual AI chat → Should get AI response (normal behavior)"
echo ""
echo "🔍 Check the WhatsApp groups and individual chats to verify behavior"
echo "📊 Monitor server logs for: '🤖 Processing message from:' entries"
