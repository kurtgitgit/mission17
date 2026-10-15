import { jest } from '@jest/globals';

const activeAnnouncement = {
  _id: 'active-announcement-id',
  title: 'Synthetic active notice',
  body: 'A synthetic announcement that is currently public.',
  isActive: true,
};

jest.unstable_mockModule('../models/Announcement.js', () => ({
  default: {
    find: jest.fn(),
    distinct: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
  },
}));
jest.unstable_mockModule('../models/User.js', () => ({ default: { find: jest.fn() } }));
jest.unstable_mockModule('../utils/authMiddleware.js', () => ({
  verifyAdmin: (_req, res) => res.status(401).json({ message: 'Authentication failed.' }),
  logAudit: jest.fn(),
}));
jest.unstable_mockModule('../utils/asyncHandler.js', () => ({
  default: (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next),
}));
jest.unstable_mockModule('../utils/pushNotifier.js', () => ({
  sendPushNotifications: jest.fn().mockResolvedValue({ acceptedCount: 0 }),
}));

const { getPublicAnnouncementById } = await import('./announcements.js');
const Announcement = (await import('../models/Announcement.js')).default;

const makeResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe('public announcement visibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    activeAnnouncement.isActive = true;
    Announcement.findOne.mockImplementation(async ({ _id, isActive }) => {
      if (_id !== activeAnnouncement._id || (isActive === true && !activeAnnouncement.isActive)) return null;
      return activeAnnouncement;
    });
  });

  it('returns an active announcement by ID from the public detail handler', async () => {
    const req = { params: { id: activeAnnouncement._id } };
    const res = makeResponse();
    const next = jest.fn();
    await getPublicAnnouncementById(req, res, next);

    expect(res.json).toHaveBeenCalledWith(activeAnnouncement);
    expect(res.status).not.toHaveBeenCalled();
    expect(Announcement.findOne).toHaveBeenCalledWith({ _id: activeAnnouncement._id, isActive: true });
  });

  it('does not return an inactive announcement by its previously public ID', async () => {
    activeAnnouncement.isActive = false;
    const req = { params: { id: activeAnnouncement._id } };
    const res = makeResponse();
    const next = jest.fn();
    await getPublicAnnouncementById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Announcement not found.' });
    expect(Announcement.findOne).toHaveBeenCalledWith({ _id: activeAnnouncement._id, isActive: true });
  });
});
