# Panduan AI Chatbot WhatsApp

## Setup Cepat

### 1. Dapatkan Google Gemini API Key

1. Kunjungi [Google AI Studio](https://aistudio.google.com/)
2. Masuk dengan akun Google Anda
3. Klik "Get API Key" dan buat key baru
4. Salin API key Anda

### 2. Konfigurasi Bot

Edit file `config.json` Anda:

```json
{
  "features": {
    "chatbot": true,
    "autoReply": true
  },
  "googleAI": {
    "apiKey": "MASUKKAN_API_KEY_ANDA_DISINI",
    "model": "gemini-1.5-flash",
    "maxTokens": 1000,
    "temperature": 0.7,
    "systemPrompt": "Kamu adalah asisten AI WhatsApp yang membantu dalam bahasa Indonesia. Berikan jawaban yang singkat, ramah, dan mudah dipahami. Gunakan format WhatsApp dengan emoji dan formatting yang tepat. Selalu jawab dalam bahasa Indonesia kecuali user meminta bahasa lain."
  }
}
```

### 3. Jalankan Bot

```bash
npm start
```

## Cara Penggunaan

### Mode Percakapan

**Aktivasi Mode Percakapan:**
- `/ai` atau `/chat` - Aktifkan mode percakapan bebas
- Setelah aktif: Chat bebas tanpa perlu perintah!

**Contoh Penggunaan:**
```
User: /ai Halo, apa kabar?
Bot: 🎯 Mode Percakapan Diaktifkan!
     Mantap! Sekarang kamu bisa chat denganku bebas...

User: Ceritakan tentang Indonesia
Bot: 🇮🇩 Indonesia adalah negara kepulauan terbesar di dunia...

User: Bagaimana dengan makanannya?
Bot: 🍽️ Makanan Indonesia sangat beragam dan lezat...
```

### Kontrol Mode Percakapan

- `/activate` - Aktifkan mode percakapan saja
- `/deactivate` - Matikan mode percakapan
- `/status` - Cek status mode saat ini
- `/reset` - Hapus semua riwayat percakapan
- `/help` - Tampilkan bantuan

### Auto-Reply untuk Pertanyaan

Ketika `autoReply` diaktifkan, bot akan otomatis menjawab pertanyaan:

**Contoh:**
- `Apa ibu kota Indonesia?`
- `Bagaimana cara memasak nasi goreng?`
- `Bisakah kamu membantu saya?`

### Penggunaan API

Kirim permintaan AI chat melalui API:

```bash
# Chat AI dasar
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "number": "628123456789",
    "message": "Buatkan puisi pendek tentang Indonesia"
  }'

# Dengan autentikasi
curl -X POST http://localhost:3000/ai-chat \
  -u "admin:admin123" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "628123456789",
    "message": "Jelaskan tentang kecerdasan buatan"
  }'
```

## Kustomisasi

### System Prompt dalam Bahasa Indonesia

Sesuaikan perilaku AI dengan mengubah `systemPrompt`:

```json
{
  "googleAI": {
    "systemPrompt": "Kamu adalah asisten customer service untuk TokoTech. Bersikap profesional, membantu, dan selalu sebutkan layanan 24/7 kami. Jawab dalam bahasa Indonesia dengan maksimal 100 kata."
  }
}
```

### Format WhatsApp Lengkap

Bot sudah dikonfigurasi untuk menggunakan semua format WhatsApp yang tersedia:

- **Bold text**: `*teks tebal*` → *teks tebal*
- **Italic text**: `_teks miring_` → _teks miring_
- **Strikethrough**: `~teks dicoret~` → ~teks dicoret~
- **Monospace**: ` ```kode``` ` → ```kode```
- **Bulleted Lists**: `• item` → • item
- **Numbered Lists**: `1. item` → 1. item
- **Quotes**: `❝kutipan❞` → ❝kutipan❞
- **Emojis**: Penggunaan emoji yang sesuai konteks

### Contoh Penggunaan Format

```
User: /ai Buatkan tutorial singkat tentang cara memasak mie instan

Bot: 🍜 *Cara Memasak Mie Instan*

*Bahan yang diperlukan:*
• 1 bungkus mie instan
• 2 gelas air
• Bumbu sesuai selera

*Langkah-langkah:*
1. Didihkan air dalam panci
2. Masukkan mie ke air mendidih
3. Tunggu 3 menit sambil diaduk
4. Tambahkan bumbu sesuai selera
5. Angkat dan siap disajikan

❝Tips: Jangan terlalu lama memasak agar mie tidak lembek❞

_Selamat mencoba!_ 😋
```

### Fitur Percakapan Lanjutan

- 🧠 **Memori Konteks**: Bot mengingat percakapan dalam sesi
- ⏰ **Auto-Deaktivasi**: Mode mati otomatis setelah 5 menit tidak ada aktivitas
- 🔄 **Manajemen Memori**: Pembersihan otomatis untuk performa optimal
- 💬 **Chat Natural**: Tidak perlu perintah setelah mode diaktifkan

## Troubleshooting

### Bot Tidak Merespon
1. Pastikan API key Google Gemini valid
2. Cek koneksi internet
3. Periksa log error di console

### Mode Percakapan Tidak Aktif
1. Gunakan `/ai` atau `/chat` untuk mengaktifkan
2. Cek status dengan `/status`
3. Reset jika perlu dengan `/reset`

### Format Pesan Tidak Sesuai
1. Pastikan `whatsappFormatting` diaktifkan di config
2. Cek `enhanceWhatsAppFormatting` di code

## Tips Penggunaan

1. **Aktifkan Mode Percakapan** untuk chat yang lebih natural
2. **Gunakan Bahasa Sehari-hari** - bot mengerti konteks Indonesia
3. **Manfaatkan Emoji** - bot akan merespon dengan emoji yang sesuai
4. **Chat Berkelanjutan** - bot mengingat konteks percakapan
5. **Reset Jika Perlu** - gunakan `/reset` untuk mulai fresh
6. **Test Format** - gunakan `./test-formatting-lengkap.sh` untuk test semua format

## Script Testing

### Test Basic
```bash
# Test percakapan dasar
./test-ai-chat-indonesia.sh
```

### Test Formatting Lengkap
```bash
# Test semua format WhatsApp
./test-formatting-lengkap.sh
```

## Contoh Percakapan

```
User: /ai Hai bot!
Bot: 🎯 Mode Percakapan Diaktifkan!
     Hai! Senang bertemu denganmu! 😊
     Kamu mau ngobrol tentang apa?

User: Ceritakan tentang budaya Indonesia
Bot: 🇮🇩 *Budaya Indonesia*
     
     Indonesia punya budaya yang sangat beragam! 
     
     ✨ *Highlights:*
     • 🎭 Seni tradisional: Wayang, Batik, Tari
     • 🍽️ Kuliner: Rendang, Gado-gado, Sate
     • 🏛️ Arsitektur: Candi Borobudur, Rumah Adat
     • 🎵 Musik: Gamelan, Angklung
     
     Mau tahu lebih detail tentang salah satunya?

User: Ceritakan tentang batik
Bot: 🎨 *Batik Indonesia*
     
     Batik adalah seni membuat pola di kain...
```
