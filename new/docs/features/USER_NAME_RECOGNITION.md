# User Name Recognition Feature

## Overview
This enhancement makes the AI agent recognize the user who is asking questions and always mention the user's name when replying in group chats. This provides a more personalized and conversational experience.

## Changes Made

### 1. Added `getUserInfo()` Helper Function
**Location:** `index.js` (after `globalSock = sock`)

This function extracts user information from incoming messages:
```javascript
function getUserInfo(message, userJid) {
    let userName = null
    let senderJid = null
    
    // For group messages, extract sender information
    if (userJid.includes('@g.us')) {
        // In group messages, the actual sender is in participant field or key.participant
        senderJid = message.key?.participant || message.participant
        // Try to get pushName from message
        userName = message.pushName || null
        
        // If no pushName, try to extract from sender JID
        if (!userName && senderJid) {
            // Extract phone number from JID as fallback
            const phoneNumber = senderJid.replace('@s.whatsapp.net', '')
            userName = phoneNumber
        }
    } else {
        // For individual chats
        senderJid = userJid
        userName = message.pushName || userJid.replace('@s.whatsapp.net', '')
    }
    
    return {
        userName: userName,
        senderJid: senderJid,
        isGroup: userJid.includes('@g.us')
    }
}
```

### 2. Enhanced `getAIResponse()` Function
**Location:** `index.js` (function starting at line ~327)

**Changes:**
- Added `userName` parameter to function signature
- Added logic to include user context in group messages
- Modified system prompts to instruct AI to mention user names

**Key Enhancement:**
```javascript
// Build user context for group messages
let userContext = ''
if (isGroup && userName) {
    userContext = `\n\nUser yang bertanya: ${userName}${userName ? ` - tolong selalu sebut nama ${userName} ketika merespon.` : ''}`
}
```

### 3. Updated Message Processing Logic
**Location:** `index.js` (messages.upsert event handler)

**Changes:**
- Extract user information before calling AI
- Pass userName to `getAIResponse()` function
- Added logging for debugging

**Key Code:**
```javascript
// Extract user information
const userInfo = getUserInfo(msg, msg.key.remoteJid)
console.log('👤 User info extracted:', userInfo)

// Generate AI response with user information
const aiResponse = await getAIResponse(messageToProcess, msg.key.remoteJid, userInfo.userName)
```

### 4. Enhanced `/ai-chat` API Endpoint
**Location:** `index.js` (POST /ai-chat endpoint)

**Changes:**
- Added optional `userName` parameter support
- Pass userName to `getAIResponse()` function
- Include userName in API response

**Usage:**
```bash
curl -X POST http://localhost:3000/ai-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:admin123' | base64)" \
  -d '{
    "number": "628986182128-1627374981@g.us",
    "message": "How are you today?",
    "userName": "John Doe"
  }'
```

## How It Works

### Group Messages
1. When a message is received in a group chat, the system extracts:
   - **pushName**: The display name set by the user
   - **participant**: The sender's JID (phone number)
   - **isGroup**: Identifies if it's a group chat

2. The AI receives a modified system prompt:
   ```
   User yang bertanya: John Doe - tolong selalu sebut nama John Doe ketika merespon.
   ```

3. The AI will respond mentioning the user's name:
   ```
   Halo John Doe! Hari ini saya baik sekali, terima kasih sudah bertanya! 😊
   ```

### Individual Messages
- Works normally without mentioning names (as it's not necessary in 1-on-1 chats)
- Still extracts userName for consistency

### Fallback Behavior
- If `pushName` is not available, uses phone number as username
- If no user info available, operates normally without mentioning names

## Benefits

1. **Personalized Responses**: AI mentions the user's name in group chats
2. **Better Group Experience**: Clear who the AI is responding to
3. **Consistent Behavior**: Works with all AI commands and conversation modes
4. **API Support**: Can manually specify userName via API
5. **Backward Compatible**: Existing functionality remains unchanged

## Testing

Run the test to verify functionality:
```bash
cd /home/yama/newwaapi/new
node test-user-name.js
```

## Examples

### Before (Group Chat)
```
User: @bot how are you?
Bot: I'm doing well, thank you for asking!
```

### After (Group Chat)
```
User: @bot how are you?
Bot: Halo John! Saya baik sekali hari ini, terima kasih John sudah bertanya! 😊
```

### Individual Chat (No Change)
```
User: how are you?
Bot: I'm doing well, thank you for asking!
```

## Configuration
No additional configuration required. The feature works automatically when:
- WhatsApp provides pushName in the message
- Message is sent in a group chat
- AI chatbot is enabled

## Limitations
- Depends on WhatsApp providing pushName in message data
- Falls back to phone number if pushName unavailable
- Only mentions names in group chats (individual chats don't need it)
