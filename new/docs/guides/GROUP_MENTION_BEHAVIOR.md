# 📱 WhatsApp Group Bot Behavior Guide

## Overview
This guide explains how the WhatsApp AI chatbot behaves differently in individual chats versus group chats, particularly regarding when it responds to messages.

## 🔄 Response Behavior

### Individual Chats (Direct Messages)
- **AI Chatbot**: Responds based on normal rules (commands, conversation mode, etc.)
- **Auto-Reply**: Works normally when enabled (`doReplies = true`)
- **Mentions**: Not applicable in individual chats

### Group Chats  
- **AI Chatbot**: Only responds when the bot is **mentioned** (`@botname`)
- **Auto-Reply**: **Disabled** - will not auto-reply even if `doReplies = true`
- **Mentions**: Required for any bot interaction

## 🎯 Group Mention Detection

### How Bot Mentions Work
The bot detects mentions in two ways:

1. **WhatsApp Mention Object**: Through `contextInfo.mentionedJid` array
2. **Text Pattern**: By searching for `@[bot_number]` in message text

### Example Group Interactions

**✅ Bot WILL Respond:**
```
User: @6281234567890 hello there!
User: /ai @6281234567890 what's the weather?
User: Hey @6281234567890, can you help me?
```

**❌ Bot WON'T Respond:**
```
User: hello everyone
User: /ai what's the weather?  (no mention)
User: how is everyone doing?
```

## 🛠️ Technical Implementation

### Code Structure
```javascript
// Check if in group and bot is mentioned
const isGroup = userJid.includes('@g.us')
if (isGroup) {
    const botMentioned = isBotMentioned(message, messageText)
    if (!botMentioned) {
        return false // Don't respond
    }
}
```

### Mention Detection Function
```javascript
function isBotMentioned(message, messageText) {
    // Check WhatsApp mention object
    const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    if (mentions.includes(sock.user.id)) return true
    
    // Check text pattern
    const botNumber = sock.user.id.replace('@s.whatsapp.net', '')
    const mentionPattern = new RegExp(`@${botNumber}\\b`, 'i')
    return mentionPattern.test(messageText)
}
```

## 📋 Configuration

### Auto-Reply Settings
```javascript
// In config.json
{
    "doReplies": true,  // Only affects individual chats now
    "features": {
        "chatbot": true  // AI responses still work in groups when mentioned
    }
}
```

### Group Behavior Features
- ✅ Prevents spam in group chats
- ✅ Allows targeted interaction through mentions  
- ✅ Maintains normal behavior in individual chats
- ✅ Respects conversation mode when mentioned in groups
- ✅ Supports all AI commands when mentioned

## 🚀 Usage Examples

### Starting Conversation Mode in Group
```
User: @6281234567890 /chat
Bot: 🎯 Mode Percakapan Diaktifkan! [activation message]

User: @6281234567890 how are you?
Bot: [AI response - conversation mode active]
```

### Direct AI Commands in Group
```
User: @6281234567890 /ai tell me a joke
Bot: [AI response with joke]
```

### Normal Group Chat (No Response)
```
User1: Hey everyone, how's the project going?
User2: Going well, almost done with phase 1
[Bot stays silent - no mention]
```

## ⚙️ Benefits

1. **Reduced Spam**: Bot doesn't interrupt every group conversation
2. **Targeted Interaction**: Users can explicitly call the bot when needed
3. **Natural Flow**: Group conversations flow naturally without bot interference
4. **Privacy Friendly**: Bot only processes messages when explicitly mentioned
5. **Flexible**: All bot features still available through mentions

## 🔧 Troubleshooting

### Bot Not Responding in Group
- Ensure you mention the bot: `@[bot_number]`
- Check that the bot number is correct
- Verify the bot is properly connected (`sock.user.id` exists)

### Bot Responding Too Much
- This behavior prevents over-responding
- Only responds when mentioned in groups
- Individual chats work normally

## 📚 Related Features

- [Auto Mention Detection](./AUTO_MENTION_GUIDE.md)
- [Conversation Mode](./CONVERSATION_MODE_GUIDE.md)  
- [AI Chatbot Commands](./AI_CHATBOT_SETUP.md)

---
*This guide covers the group mention behavior implemented to prevent spam and enable targeted bot interactions in WhatsApp groups.*
