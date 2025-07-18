/**
 * Chat controller
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../models');

/**
 * Get all chats
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function getChats(req, res) {
  try {
    // Sort by last message time (most recent first)
    const sortedChats = db.chats.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    res.json(sortedChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Create new chat
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function createChat(req, res) {
  try {
    const { customerId, chatType } = req.body;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }
    
    // Check if chat already exists with this customer
    const existingChat = db.chats.find(chat => chat.customerId === customerId);
    if (existingChat) {
      return res.json(existingChat);
    }
    
    const newChat = {
      id: uuidv4(),
      customerId,
      chatType: chatType || 'general',
      createdAt: new Date().toISOString(),
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0
    };
    
    db.chats.push(newChat);
    res.json(newChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get chat by ID
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function getChatById(req, res) {
  try {
    const chat = db.chats.find(c => c.id === req.params.id);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Mark chat as read
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function markChatAsRead(req, res) {
  try {
    const chat = db.chats.find(c => c.id === req.params.id);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    chat.unreadCount = 0;
    res.json(chat);
  } catch (error) {
    console.error('Error marking chat as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get messages for a chat
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function getChatMessages(req, res) {
  try {
    const chatId = req.params.id;
    const chatMessages = db.messages.filter(m => m.chatId === chatId);
    
    // Sort by creation time (oldest first)
    const sortedMessages = chatMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json(sortedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Send message
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function sendMessage(req, res) {
  try {
    const { chatId, senderId, content, messageType = 'text', attachmentUrl, attachmentType, attachmentName } = req.body;
    
    if (!chatId || !senderId || !content) {
      return res.status(400).json({ error: 'Chat ID, sender ID, and content are required' });
    }
    
    const chat = db.chats.find(c => c.id === chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    const newMessage = {
      id: uuidv4(),
      chatId,
      senderId,
      content,
      messageType,
      attachmentUrl,
      attachmentType,
      attachmentName,
      createdAt: new Date().toISOString(),
      status: 'sent'
    };
    
    db.messages.push(newMessage);
    
    // Update chat's last message info
    chat.lastMessage = content;
    chat.lastMessageTime = new Date().toISOString();
    
    // If message is from customer, increment unread count
    if (senderId !== 'admin') {
      chat.unreadCount = (chat.unreadCount || 0) + 1;
    }
    
    res.json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Delete chat
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function deleteChat(req, res) {
  try {
    const chatId = req.params.id;
    const chatIndex = db.chats.findIndex(c => c.id === chatId);
    
    if (chatIndex === -1) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    // Remove chat and all its messages
    db.chats.splice(chatIndex, 1);
    db.messages = db.messages.filter(m => m.chatId !== chatId);
    
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Search chats
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function searchChats(req, res) {
  try {
    const query = req.params.query.toLowerCase();
    const filteredChats = db.chats.filter(chat => {
      const customer = db.customers.find(c => c.id === chat.customerId);
      const customerName = customer ? customer.name.toLowerCase() : '';
      const lastMessage = chat.lastMessage.toLowerCase();
      
      return customerName.includes(query) || lastMessage.includes(query);
    });
    
    res.json(filteredChats);
  } catch (error) {
    console.error('Error searching chats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getChats,
  createChat,
  getChatById,
  markChatAsRead,
  getChatMessages,
  sendMessage,
  deleteChat,
  searchChats
};
