# 🎯 Time-Based Conversation Mode - Complete Guide

Your WhatsApp AI chatbot now features an intelligent **Time-Based Conversation Mode** that automatically manages conversation context based on user activity and time patterns!

## 🚀 What's New?

### ⏰ **Automatic Conversation Mode**
- **Auto-Activation**: Triggered by specific message patterns or commands
- **5-Minute Timeout**: Automatically deactivates after 5 minutes of inactivity
- **Timer Reset**: Each user message resets the 5-minute countdown
- **Smart Notifications**: Users get notified when conversation mode deactivates

### 🎯 **How It Works**

#### **Conversation Mode Lifecycle:**
1. **🟢 ACTIVATION** - Triggered by:
   - Commands: `/ai`, `/chat`, `/conversation`, `/activate`
   - Long messages (60+ characters)
   - Conversation indicators: "tell me about", "explain", "I want to discuss"
   - Questions suggesting detailed discussion

2. **🔄 ACTIVE STATE** - Features:
   - Full conversation context maintained
   - AI references previous messages
   - 5-minute activity timer running
   - Timer resets with each user message

3. **⏰ TIMEOUT WARNING** - After 5 minutes:
   - Conversation mode automatically deactivates
   - User receives inactivity notification
   - Conversation history preserved

4. **⏸️ INACTIVE STATE** - Characteristics:
   - AI treats messages as standalone
   - History preserved but not actively used
   - Can be reactivated anytime

## 🎮 Usage Examples

### **Starting Conversation Mode:**

**Method 1: Explicit Command**
```
You: /ai I want to plan my vacation to Japan
AI: 🎯 *Conversation Mode Active* - I'll remember our discussion for better context!

Great! I'd love to help you plan your trip to Japan...
```

**Method 2: Natural Trigger**
```
You: Can you help me understand machine learning concepts and how to get started with it?
AI: 🎯 *Conversation Mode Active* - I'll remember our discussion for better context!

I'd be happy to help you understand machine learning...
```

### **Conversation Flow:**
```
You: What programming languages should I learn first?
AI: Since you mentioned wanting to learn machine learning, I'd recommend starting with Python...

You: How long would it take to become proficient?
AI: For machine learning with Python that we discussed, typically it takes...

You: What about job opportunities?
AI: Given your interest in machine learning and Python development we talked about...
```

### **Automatic Timeout:**
```
[After 5 minutes of no messages]

AI: 💤 *Conversation Mode Deactivated*

I've paused our active conversation due to inactivity. Your previous messages are still saved!

To continue our conversation, simply:
• Type */ai* to reactivate conversation mode
• Ask a question naturally  
• Use */help* for more options

I'm still here and ready to help! 😊
```

## 🛠️ Commands & Controls

### **Main Commands:**
- `/ai [message]` - Start conversation mode and chat
- `/chat [message]` - Same as /ai
- `/activate` - Turn on conversation mode only
- `/deactivate` - Turn off conversation mode
- `/status` - Show detailed conversation and mode status
- `/reset` - Clear all conversation history and mode
- `/help` - Show comprehensive help

### **Status Information:**
```
You: /status
AI: 📊 *Conversation Statistics*

🔹 *Conversation Mode:* 🎯 *ACTIVE* (3 min remaining)
🔹 *Messages exchanged:* 8
🔹 *Messages in context:* 8
🔹 *Started:* [timestamp]
🔹 *Last activity:* [timestamp]
🔹 *Chat type:* Individual

💡 *Conversation mode is active* - I'll remember our discussion context!
```

## 🔧 API Management

### **New API Endpoints:**

**Check Conversation Mode Status:**
```bash
GET /conversation-mode/:number
```

**Activate Conversation Mode:**
```bash
POST /conversation-mode/:number/activate
```

**Deactivate Conversation Mode:**
```bash
POST /conversation-mode/:number/deactivate
Content-Type: application/json
{
  "sendNotification": true
}
```

**Enhanced Conversation Stats:**
```bash
GET /conversation-stats/:number
```

### **API Response Example:**
```json
{
  "status": true,
  "response": {
    "active": true,
    "timeoutMinutes": 5,
    "stats": {
      "active": true,
      "activatedAt": "2025-01-27T10:30:00.000Z",
      "timeoutMinutes": 5,
      "timeRemainingMs": 180000
    }
  }
}
```

## 🎯 Smart Features

### **Automatic Triggers:**
- **Commands**: `/ai`, `/chat`, `/conversation`, `/talk`
- **Long Messages**: 60+ characters automatically trigger mode
- **Conversation Patterns**: "tell me about", "explain", "I want to discuss"
- **Question Types**: "what do you think", "how would you", "can you help me with"
- **Follow-ups**: "furthermore", "additionally", "what about"

### **Context Management:**
- **Memory Preservation**: History saved even when mode is inactive
- **Smart Context**: Full context used only in active mode
- **Efficient Processing**: Standalone responses when mode is inactive
- **Automatic Cleanup**: Old conversations cleaned up automatically

### **User Experience:**
- **Clear Indicators**: Mode status shown in responses
- **Helpful Notifications**: Proactive communication about mode changes
- **Easy Recovery**: Simple reactivation process
- **Consistent Behavior**: Predictable timeout and reset patterns

## ⚙️ Configuration

### **Timing Settings** (in config.json):
```json
{
  "googleAI": {
    "conversationModeTimeout": 300000,  // 5 minutes in milliseconds
    "conversationTimeout": 1800000,    // 30 minutes total timeout
    "maxHistoryLength": 20              // Maximum messages in context
  }
}
```

### **Customizable Parameters:**
- **Mode Timeout**: How long before auto-deactivation (default: 5 minutes)
- **Context Length**: Maximum messages to remember (default: 20)
- **Cleanup Interval**: How often to clean old conversations (default: 30 minutes)
- **Notification Delay**: Delay before sending inactivity notification (default: 1 second)

## 🧪 Testing

Run the comprehensive test script:
```bash
./test-conversation-mode.sh
```

This tests:
- ✅ Automatic mode activation
- ✅ Timer reset functionality
- ✅ Manual activation/deactivation
- ✅ Inactivity notifications
- ✅ Context preservation
- ✅ API endpoint functionality

## 📊 Benefits

### **For Users:**
- 🎯 **Smarter Conversations**: AI maintains context intelligently
- ⏰ **No Manual Management**: Automatic activation and deactivation
- 💬 **Natural Flow**: Seamless conversation experience
- 🔔 **Clear Communication**: Always know when mode is active/inactive

### **For Developers:**
- 🚀 **Scalable**: Efficient resource usage
- 🔧 **Controllable**: Full API control over conversation modes
- 📊 **Monitorable**: Comprehensive status and statistics
- ⚡ **Responsive**: Real-time mode management

## 🆘 Troubleshooting

**Mode not activating?**
- Try using explicit `/ai` command
- Check if message is long enough (60+ characters)
- Use conversation trigger phrases

**Want to extend timeout?**
- Just send another message to reset the 5-minute timer
- Or manually activate with `/activate`

**Context not working?**
- Check if conversation mode is active with `/status`
- Mode might have timed out - reactivate with `/ai`

**Too many notifications?**
- Modes only send one notification per timeout
- Clear conversation with `/reset` if needed

## 🎉 Summary

Your AI chatbot now intelligently manages conversation context with time-based activation:

- 🎯 **Auto-activates** for conversation-like messages
- ⏰ **5-minute timeout** with automatic deactivation  
- 🔄 **Timer resets** with user activity
- 📱 **Smart notifications** keep users informed
- 🧠 **Context preservation** for seamless conversations
- 🛠️ **Full API control** for advanced management

Experience natural, flowing conversations with intelligent context management! 🚀
