/**
 * Chat routes
 */
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat');

// Chat routes
router.get('/', chatController.getChats);
router.post('/', chatController.createChat);
router.get('/:id', chatController.getChatById);
router.put('/:id/mark-read', chatController.markChatAsRead);
router.get('/:id/messages', chatController.getChatMessages);
router.post('/messages', chatController.sendMessage);
router.delete('/:id', chatController.deleteChat);
router.get('/search/:query', chatController.searchChats);

module.exports = router;
