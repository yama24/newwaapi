# WhatsApp Formatting Reference

## Format yang Didukung

### Teks Styling
| Format | Syntax | Contoh | Hasil |
|--------|--------|--------|-------|
| Bold | `*text*` | `*Penting*` | **Penting** |
| Italic | `_text_` | `_catatan_` | *catatan* |
| Strikethrough | `~text~` | `~salah~` | ~~salah~~ |
| Monospace | `` ```text``` `` | `` ```kode``` `` | `kode` |

### Lists
| Format | Syntax | Contoh |
|--------|--------|--------|
| Bullet List | `• item` | `• Makanan`<br>`• Minuman` |
| Numbered List | `1. item` | `1. Persiapan`<br>`2. Proses` |

### Kutipan
| Format | Syntax | Contoh |
|--------|--------|--------|
| Quote | `❝text❞` | `❝Hidup adalah pilihan❞` |

### Emoji
Bot secara otomatis menambahkan emoji yang sesuai konteks.

## Contoh Kombinasi Format

```
*Tutorial Membuat Website* 🌐

Berikut langkah-langkah dasar:

1. *Persiapan*
   • Install Node.js
   • Install ```npm```
   • Siapkan editor kode

2. *Membuat Project*
   ```bash
   npm init -y
   npm install express
   ```

3. *Kode Dasar*
   ```javascript
   const express = require('express')
   const app = express()
   
   app.get('/', (req, res) => {
     res.send('Hello World!')
   })
   
   app.listen(3000)
   ```

❝Praktek adalah kunci sukses programming❞

_Semoga bermanfaat!_ ✨
```

## Tips Penggunaan

1. **Konsistensi**: Gunakan format yang konsisten dalam satu pesan
2. **Readability**: Jangan terlalu banyak format dalam satu kalimat
3. **Context**: Gunakan format sesuai konteks (bold untuk penting, italic untuk catatan)
4. **Testing**: Gunakan script test untuk melihat hasil formatting

## Testing Format

```bash
# Test semua format
./test-formatting-lengkap.sh

# Test basic conversation
./test-ai-chat-indonesia.sh
```

Bot secara otomatis akan memformat respons sesuai dengan panduan ini!
