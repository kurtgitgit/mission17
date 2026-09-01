import express from 'express';
import Notification from '../models/Notification.js';
import { verifyAuthenticatedUser } from '../utils/authMiddleware.js';

const router = express.Router();

// GET all notifications for a user
router.get('/notifications/:userId', verifyAuthenticatedUser, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure the user requesting is the owner, or is an admin.
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to view these notifications' });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50); // limit to most recent 50

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT mark a notification as read
router.put('/notifications/:id/read', verifyAuthenticatedUser, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Ensure the user requesting is the owner
    if (notification.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to update this notification' });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
