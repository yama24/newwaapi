#!/bin/bash

# Quick test untuk Google AI API error fix
echo "🔧 Test Fix Google AI API Error"
echo "==============================="
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
echo "🧪 Testing fix untuk Google AI API error..."
echo ""

# Test simple message
echo "1️⃣ Test pesan sederhana..."
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$PHONE_NUMBER\",
    \"message\": \"/ai Halo, apa kabar?\"
  }" | jq '.'

echo ""
echo "✅ Test selesai! Periksa apakah masih ada error Google AI API."
