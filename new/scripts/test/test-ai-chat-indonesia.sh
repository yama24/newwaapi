#!/bin/bash

# Script Test AI Chatbot Indonesia
# Script ini mendemonstrasikan fitur chatbot AI dalam bahasa Indonesia

echo "🤖 Script Test WhatsApp AI Chatbot Indonesia"
echo "============================================"
echo ""

# Cek apakah server berjalan
if ! curl -s http://localhost:3000/info > /dev/null; then
    echo "❌ Server tidak berjalan. Silakan start server terlebih dahulu:"
    echo "   npm start"
    exit 1
fi

echo "✅ Server berjalan"
echo ""

# Dapatkan info bot
echo "📱 Mengambil informasi bot..."
curl -s http://localhost:3000/info | jq '.' || echo "Server berjalan tapi mungkin belum sepenuhnya terinisialisasi"
echo ""

# Input nomor telefon
read -p "📞 Masukkan nomor test (contoh: 628123456789): " PHONE_NUMBER

if [ -z "$PHONE_NUMBER" ]; then
    echo "❌ Nomor telefon diperlukan"
    exit 1
fi

echo ""
echo "🚀 Memulai test chat dengan nomor: $PHONE_NUMBER"
echo ""

# Test 1: Aktivasi mode percakapan
echo "1️⃣ Test aktivasi mode percakapan..."
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$PHONE_NUMBER\",
    \"message\": \"/ai Halo bot, apa kabar?\"
  }" | jq '.'
echo ""
sleep 2

# Test 2: Chat bebas setelah aktivasi
echo "2️⃣ Test chat bebas (tanpa command)..."
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$PHONE_NUMBER\",
    \"message\": \"Ceritakan tentang Indonesia dalam 3 kalimat\"
  }" | jq '.'
echo ""
sleep 2

# Test 3: Pertanyaan follow-up
echo "3️⃣ Test pertanyaan follow-up..."
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$PHONE_NUMBER\",
    \"message\": \"Bagaimana dengan makanan tradisionalnya?\"
  }" | jq '.'
echo ""
sleep 2

# Test 4: Cek status percakapan
echo "4️⃣ Test status percakapan..."
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$PHONE_NUMBER\",
    \"message\": \"/status\"
  }" | jq '.'
echo ""
sleep 2

# Test 5: Chat dengan emoji dan formatting
echo "5️⃣ Test response dengan formatting..."
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$PHONE_NUMBER\",
    \"message\": \"Buat list 5 tempat wisata terbaik di Indonesia\"
  }" | jq '.'
echo ""
sleep 2

# Test 6: Test help command
echo "6️⃣ Test command bantuan..."
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$PHONE_NUMBER\",
    \"message\": \"/help\"
  }" | jq '.'
echo ""
sleep 2

# Test 7: Deaktivasi mode
echo "7️⃣ Test deaktivasi mode percakapan..."
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$PHONE_NUMBER\",
    \"message\": \"/deactivate\"
  }" | jq '.'
echo ""
sleep 2

# Test 8: Reset percakapan
echo "8️⃣ Test reset percakapan..."
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$PHONE_NUMBER\",
    \"message\": \"/reset\"
  }" | jq '.'
echo ""

echo "🎉 Test selesai!"
echo ""
echo "📊 Untuk melihat detail percakapan:"
echo "   curl http://localhost:3000/conversation-stats/$PHONE_NUMBER | jq '.'"
echo ""
echo "🗂️ Untuk melihat riwayat percakapan:"
echo "   curl http://localhost:3000/conversation-history/$PHONE_NUMBER | jq '.'"
echo ""
echo "🔄 Untuk menghapus percakapan:"
echo "   curl -X DELETE http://localhost:3000/conversation/$PHONE_NUMBER"
