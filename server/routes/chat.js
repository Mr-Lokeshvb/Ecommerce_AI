const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const quickResponses = require('../data/quickResponses');

// Mock chat data storage (in production, use a database)
let chats = [];
let messages = [];

// Get all chats for a user
router.get('/', auth, (req, res) => {
  try {
    const userChats = chats.filter(chat =>
      chat.participants.some(p => p.id === req.user.id)
    );
    res.json(userChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new chat
router.post('/', auth, (req, res) => {
  try {
    const { type, participants, title } = req.body;

    const newChat = {
      id: Date.now().toString(),
      type,
      participants: [
        { id: req.user.id, name: req.user.name, role: req.user.role },
        ...participants
      ],
      title,
      unreadCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    chats.push(newChat);
    res.status(201).json(newChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a specific chat
router.get('/:chatId/messages', auth, (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = chats.find(c => c.id === chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(p => p.id === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const chatMessages = messages.filter(m => m.chatId === chatId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json(chatMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/:chatId/messages', auth, (req, res) => {
  try {
    const { chatId } = req.params;
    const { message, messageType = 'text' } = req.body;

    const chat = chats.find(c => c.id === chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(p => p.id === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const newMessage = {
      id: Date.now().toString(),
      chatId,
      senderId: req.user.id,
      senderName: req.user.name,
      senderRole: req.user.role,
      message,
      timestamp: new Date(),
      isRead: false,
      messageType
    };

    messages.push(newMessage);

    // Update chat's last message and timestamp
    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex !== -1) {
      chats[chatIndex].lastMessage = newMessage;
      chats[chatIndex].updatedAt = new Date();
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.put('/:chatId/read', auth, (req, res) => {
  try {
    const { chatId } = req.params;
    const { messageId } = req.body;

    const chat = chats.find(c => c.id === chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(p => p.id === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark messages as read
    messages.forEach(message => {
      if (message.chatId === chatId && (!messageId || message.id === messageId)) {
        message.isRead = true;
      }
    });

    // Reset unread count for this user
    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex !== -1) {
      chats[chatIndex].unreadCount = 0;
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a chat
router.delete('/:chatId', auth, (req, res) => {
  try {
    const { chatId } = req.params;

    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex === -1) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const chat = chats[chatIndex];

    // Check if user is participant
    const isParticipant = chat.participants.some(p => p.id === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove chat and its messages
    chats.splice(chatIndex, 1);
    messages = messages.filter(m => m.chatId !== chatId);

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bot response endpoint (no auth required - available to all users)
router.post('/bot-response', async (req, res) => {
  try {
    const { userMessage, chatId } = req.body;
    const Product = require('../models/Product'); // Import Product model

    const lowerMessage = userMessage.toLowerCase();
    let botResponse = "I'm here to help! How can I assist you today?";
    let useAI = false;
    let quickMatchFound = false;

    // ============================================
    // ⚡ Quick Chat / Keyword Responses
    // ============================================
    const normalizedMessage = lowerMessage.replace(/[?.,!]/g, '').trim();

    // Helper function to check if a keyword matches with word boundaries
    const matchesWithBoundary = (message, keyword) => {
      const cleanMessage = message.replace(/[?.,!]/g, '').trim();
      const cleanKeyword = keyword.toLowerCase().replace(/[?.,!]/g, '').trim();

      // Exact match after cleaning
      if (cleanMessage === cleanKeyword) return true;

      // Check if keyword appears as complete words
      const regex = new RegExp(`\\b${cleanKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(cleanMessage);
    };

    // Sort keys by length (longest first) for better matching
    const sortedKeys = Object.keys(quickResponses).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
      if (matchesWithBoundary(normalizedMessage, key)) {
        botResponse = quickResponses[key];
        quickMatchFound = true;
        console.log('⚡ Quick Chat match for "' + key + '": ' + botResponse.substring(0, 50) + '...');
        break;
      }
    }

    if (!quickMatchFound) {
      console.log('🔍 No quick match found for: "' + userMessage + '"');

      const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;

      if (HUGGING_FACE_API_KEY) {
        try {
          console.log('🔑 HF Key present:', !!HUGGING_FACE_API_KEY);
          // Using Mistral-7B-Instruct-v0.3 which is reliable on HF Inference API
          const hfUrl = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3';
          console.log('🤖 Sending request to Hugging Face URL:', hfUrl);

          const response = await fetch(hfUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              inputs: `<s>[INST] You are a helpful and friendly e-commerce shopping assistant for Fashion Era. Help customers with product recommendations, order tracking, shipping information, returns, payments, and general questions about the store. Be concise, friendly, and helpful. Do not repeat the user's message.
              
              User message: ${userMessage} [/INST]`,
              parameters: {
                max_new_tokens: 500,
                temperature: 0.7,
                return_full_text: false
              }
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data[0] && data[0].generated_text) {
              botResponse = data[0].generated_text.trim();
              useAI = true;
            } else if (data.generated_text) {
              botResponse = data.generated_text.trim();
              useAI = true;
            }
          } else {
            const errorText = await response.text();
            console.error(`❌ HF API Error Status: ${response.status} ${response.statusText}`);
            console.error(`❌ HF API Error Body: ${errorText}`);
          }
        } catch (aiError) {
          console.error('❌ Hugging Face API Integration Error:', aiError.message);
        }
      }

      // If AI failed or was not configured, use final Rule-based responses
      if (!useAI) {
        console.log('🔄 Using rule-based fallback responses...');
        // Mock product data
        const mockProducts = [
          { id: 1, name: "Premium Cotton T-Shirt", price: 29.99, category: "Fashion" },
          { id: 2, name: "Wireless Bluetooth Headphones", price: 79.99, category: "Electronics" },
          { id: 3, name: "Leather Handbag", price: 149.99, category: "Accessories" },
          { id: 4, name: "Smart Fitness Watch", price: 199.99, category: "Electronics" },
          { id: 8, name: "Running Shoes", price: 119.99, category: "Sports" }
        ];

        if (normalizedMessage.includes('product') || normalizedMessage.includes('shop') || normalizedMessage.includes('buy')) {
          botResponse = `🛍️ Here are some of our popular products:\n${mockProducts.map(p => `• ${p.name} - $${p.price}`).join('\n')}`;
        } else if (normalizedMessage.includes('order') || normalizedMessage.includes('track')) {
          botResponse = "📦 You can track your order in the 'My Orders' section of your profile!";
        } else if (normalizedMessage.includes('shipping') || normalizedMessage.includes('delivery')) {
          botResponse = "🚚 We offer free shipping on orders over $50! Standard delivery takes 3-5 business days.";
        } else if (normalizedMessage.includes('hello') || normalizedMessage.includes('hi')) {
          botResponse = "👋 Hello! How can I help you find something special today?";
        } else {
          botResponse = "I'm here to help! Could you please tell me more about what you're looking for?";
        }
      }
    }

    // Create bot message response
    const botMessage = {
      id: (Date.now() + 1).toString(),
      chatId,
      senderId: 'bot',
      senderName: 'AI Assistant',
      senderRole: 'BOT',
      message: botResponse,
      timestamp: new Date(),
      isRead: false,
      messageType: 'text'
    };

    messages.push(botMessage);

    res.json({
      success: true,
      data: botMessage
    });
  } catch (error) {
    console.error('Error generating bot response:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
