# Auto Mention Feature

## Overview
This feature automatically detects `@something` patterns in messages and converts them to proper WhatsApp mentions when sending to group chats.

## How It Works

### Pattern Detection
- Scans messages for `@username` patterns using regex `/@(\w+)/g`
- Extracts the username part after the `@` symbol
- Supports alphanumeric usernames (letters, numbers, underscore)

### Group Chat Processing
For group chats (`@g.us`):
1. Gets group metadata and participant list
2. Matches `@username` patterns against:
   - Phone numbers (e.g., `@628986182128`)
   - Participant IDs
   - Contact names (if available)
3. Converts valid matches to WhatsApp mention format
4. Sends message with `mentions` field containing participant JIDs

### Individual Chat Processing
For individual chats (`@s.whatsapp.net`):
- Mentions are not supported by WhatsApp
- Messages are sent as regular text
- `@` patterns remain as plain text

## Usage Examples

### Basic Group Mention
```bash
curl -X POST http://localhost:3000/send-group-message \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:admin123' | base64)" \
  -d '{
    "id": "628986182128-1627374981@g.us",
    "message": "Hello @628986182128, please check this message!"
  }'
```

### Multiple Mentions
```bash
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:admin123' | base64)" \
  -d '{
    "number": "628986182128-1627374981@g.us",
    "message": "Meeting at 3pm @john @628986182128 @alice"
  }'
```

### AI Chat with Mentions
```bash
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:admin123' | base64)" \
  -d '{
    "number": "628986182128-1627374981@g.us",
    "message": "AI, please mention @628986182128 in your response"
  }'
```

## Supported Endpoints

### ✅ Endpoints with Auto Mention
- `POST /send-message` - Individual and group messages
- `POST /send-group-message` - Group messages
- `POST /ai-chat` - AI responses with mentions
- Auto-reply messages (when features.autoReply is enabled)

### Message Format Sent to WhatsApp

**Without mentions:**
```javascript
{
  text: "Hello everyone!"
}
```

**With mentions:**
```javascript
{
  text: "Hello @628986182128, how are you?",
  mentions: ["628986182128@s.whatsapp.net"]
}
```

## Mention Matching Logic

The system tries to match `@username` patterns in this order:

1. **Exact phone number match**: `@628986182128`
2. **Partial participant ID match**: `@628986` (if it matches start of participant ID)
3. **Case-insensitive match**: `@John` → `john`

## Error Handling

- **Invalid group ID**: Returns original message as text
- **Group metadata unavailable**: Logs warning, sends as text
- **No matching participants**: Sends as regular text
- **Network errors**: Falls back to plain text message

## Configuration

No additional configuration required. The feature works automatically when:
- Message contains `@` patterns
- Target is a valid group chat
- Group metadata is accessible

## Testing

Run the test script to verify functionality:
```bash
./scripts/test/test-auto-mention.sh
```

## Limitations

1. **Individual chats**: Mentions don't work (WhatsApp limitation)
2. **Username format**: Only alphanumeric characters and underscore
3. **Group participation**: Target must be a participant in the group
4. **Case sensitivity**: Matching is case-insensitive for better UX

## Security Considerations

- Only mentions participants already in the group
- Cannot mention external numbers
- No injection attacks possible (uses WhatsApp's mention system)
- Graceful fallback if mention processing fails

## Examples in Different Languages

### JavaScript/Node.js
```javascript
const response = await fetch('http://localhost:3000/send-group-message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + btoa('admin:admin123')
  },
  body: JSON.stringify({
    id: '628986182128-1627374981@g.us',
    message: 'Team meeting @alice @628986182128 at 3pm!'
  })
});
```

### Python
```python
import requests
import base64

auth = base64.b64encode(b'admin:admin123').decode('ascii')
response = requests.post(
    'http://localhost:3000/send-group-message',
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Basic {auth}'
    },
    json={
        'id': '628986182128-1627374981@g.us',
        'message': 'Hello @628986182128, please review this!'
    }
)
```

### PHP
```php
$auth = base64_encode('admin:admin123');
$data = json_encode([
    'id' => '628986182128-1627374981@g.us',
    'message' => 'Urgent: @john @628986182128 please respond ASAP'
]);

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => [
            'Content-Type: application/json',
            'Authorization: Basic ' . $auth
        ],
        'content' => $data
    ]
]);

$response = file_get_contents('http://localhost:3000/send-group-message', false, $context);
```

## Feature Status

✅ **Implemented**
- Pattern detection with regex
- Group metadata retrieval
- Participant matching
- WhatsApp mention format
- Error handling and fallbacks
- Integration with all message endpoints

🚀 **Ready for Production Use**
