const express = require('express');
const NotificationController = require('../controllers/NotificationController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', NotificationController.getNotifications);
router.get('/unread', NotificationController.getUnreadNotifications);
router.post('/read-all', NotificationController.markAllRead);

module.exports = router;
