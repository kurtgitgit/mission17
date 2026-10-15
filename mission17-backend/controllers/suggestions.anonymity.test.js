import { jest } from '@jest/globals';

const anonymousUserId = 'synthetic-resident-id';
const anonymousSuggestion = () => ({
  _id: 'synthetic-feedback-id',
  userId: anonymousUserId,
  username: 'Anonymous Resident',
  title: 'Synthetic feedback item',
  category: 'General',
  description: 'A synthetic private feedback description.',
  isAnonymous: true,
  isPrivate: true,
  status: 'New',
  toObject() {
    return {
      _id: this._id,
      userId: this.userId,
      username: this.username,
      title: this.title,
      category: this.category,
      description: this.description,
      isAnonymous: this.isAnonymous,
      isPrivate: this.isPrivate,
      status: this.status,
    };
  },
});

const suggestions = [anonymousSuggestion()];
const suggestionQuery = {
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn(),
};

jest.unstable_mockModule('../models/Suggestion.js', () => ({
  default: {
    find: jest.fn(() => suggestionQuery),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
}));
jest.unstable_mockModule('../models/Notification.js', () => ({
  default: { create: jest.fn().mockResolvedValue({}) },
}));
jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    findById: jest.fn(() => ({ select: jest.fn().mockResolvedValue({}) })),
  },
}));
jest.unstable_mockModule('../utils/pushNotifier.js', () => ({ sendPushNotification: jest.fn() }));
jest.unstable_mockModule('../utils/sentimentAnalyzer.js', () => ({ analyzeSentiment: jest.fn() }));
const { getAllSuggestions, updateStatus } = await import('./suggestions.controller.js');
const Suggestion = (await import('../models/Suggestion.js')).default;
const makeResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
});

describe('staff-facing anonymous feedback serialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    suggestionQuery.populate.mockReturnThis();
    suggestionQuery.sort.mockResolvedValue(suggestions);
  });

  it('omits the submitter identifier from the admin list for anonymous feedback', async () => {
    const req = { query: {} };
    const res = makeResponse();
    await getAllSuggestions(req, res);

    const [response] = res.json.mock.calls[0];
    expect(response[0]).not.toHaveProperty('userId');
    expect(response[0].username).toBe('Anonymous Resident');
  });

  it('omits the submitter identifier from the admin status-update response', async () => {
    Suggestion.findByIdAndUpdate.mockResolvedValueOnce(anonymousSuggestion());
    const req = { params: { id: anonymousSuggestion()._id }, body: { status: 'Under Review' } };
    const res = makeResponse();
    await updateStatus(req, res);

    const [response] = res.json.mock.calls[0];
    expect(response.suggestion).not.toHaveProperty('userId');
    expect(response.suggestion.username).toBe('Anonymous Resident');
  });

  it('keeps the linked submitter identifier for feedback not marked anonymous', async () => {
    const linkedSuggestion = anonymousSuggestion();
    linkedSuggestion.isAnonymous = false;
    linkedSuggestion.username = 'SyntheticResident';
    Suggestion.findByIdAndUpdate.mockResolvedValueOnce(linkedSuggestion);
    const req = { params: { id: linkedSuggestion._id }, body: { status: 'Under Review' } };
    const res = makeResponse();
    await updateStatus(req, res);

    const [response] = res.json.mock.calls[0];
    expect(response.suggestion.userId).toBe(anonymousUserId);
    expect(response.suggestion.username).toBe('SyntheticResident');
  });
});
