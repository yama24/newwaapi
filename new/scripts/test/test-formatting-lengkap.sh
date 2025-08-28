#!/bin/bash

# Test Script untuk Format WhatsApp Lengkap
# Script ini menguji semua fitur formatting WhatsApp yang baru

echo "🎨 Test WhatsApp Formatting Lengkap"
echo "==================================="
echo ""

# Cek apakah server berjalan
if ! curl -s http://localhost:3000/info > /dev/null; then
    echo "❌ Server tidak berjalan. Silakan start server terlebih dahulu:"
    echo "   npm start"
    exit 1
fi

echo "✅ Server berjalan"
echo ""

# Input nomor telefon
read -p "📞 Masukkan nomor test (contoh: 628123456789): " PHONE_NUMBER

if [ -z "$PHONE_NUMBER" ]; then
    echo "❌ Nomor telefon diperlukan"
    exit 1
fi

echo ""
echo "🎨 Testing semua format WhatsApp dengan nomor: $PHONE_NUMBER"
echo ""

# Test 1: Bold, Italic, Strikethrough
echo "1️⃣ Test Bold, Italic, Strikethrough..."
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$PHONE_NUMBER\",
    \"message\": \"/ai Tolong buat contoh teks dengan format bold, italic, dan strikethrough\"
  }" | jq '.'
echo ""
sleep 3

# Test 2: Monospace/Code
echo "2️⃣ Test Monospace/Code formatting..."
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$PHONE_NUMBER\",
    \"message\": \"Buat contoh kode JavaScript sederhana dengan format monospace\"
  }" | jq '.'
echo ""
sleep 3

# Test 3: Bullet Points
echo "3️⃣ Test Bullet Points..."
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$PHONE_NUMBER\",
    \"message\": \"Buat daftar 5 makanan Indonesia favorit dengan bullet points\"
  }" | jq '.'
echo ""
sleep 3

# Test 4: Numbered Lists
echo "4️⃣ Test Numbered Lists..."
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$PHONE_NUMBER\",
    \"message\": \"Buat tutorial memasak nasi goreng dalam 5 langkah dengan numbered list\"
  }" | jq '.'
echo ""
sleep 3

# Test 5: Quotes
echo "5️⃣ Test Quotes..."
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$PHONE_NUMBER\",
    \"message\": \"Berikan 3 quote motivasi dengan format quote yang tepat\"
  }" | jq '.'
echo ""
sleep 3

# Test 6: Kombinasi semua format
echo "6️⃣ Test Kombinasi semua format..."
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$PHONE_NUMBER\",
    \"message\": \"Buat panduan belajar programming yang lengkap dengan semua format: bold, italic, strikethrough, monospace, bullet points, numbered list, dan quotes\"
  }" | jq '.'
echo ""
sleep 3

# Test 7: Technical content dengan code
echo "7️⃣ Test Technical content dengan kode..."
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$PHONE_NUMBER\",
    \"message\": \"Jelaskan cara membuat REST API dengan Node.js, sertakan contoh kode\"
  }" | jq '.'
echo ""

echo "🎉 Test formatting selesai!"
echo ""
echo "📋 Format yang ditest:"
echo "  ✅ *Bold text*"
echo "  ✅ _Italic text_"
echo "  ✅ ~Strikethrough text~"
echo "  ✅ \`\`\`Monospace text\`\`\`"
echo "  ✅ • Bulleted lists"
echo "  ✅ 1. Numbered lists"
echo "  ✅ ❝Quoted text❞"
echo "  ✅ 😊 Emojis"
echo ""
echo "🔍 Periksa pesan WhatsApp untuk melihat hasil formatting!"
