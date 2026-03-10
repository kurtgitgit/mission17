import express from 'express';
import Notification from '../models/Notification.js';
import jwt from 'jsonwebtoken';

// Local Token Verification Middleware
const verifyToken = (req, res, next) => {
  const token = req.header('auth-token') || req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};
const router = express.Router();

// GET all notifications for a user
router.get('/notifications/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure the user requesting is the owner, or is an admin.
    if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'Admin') {
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
router.put('/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Ensure the user requesting is the owner
    if (notification.userId.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'Admin') {
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
