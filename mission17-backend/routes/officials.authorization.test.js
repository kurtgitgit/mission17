import { jest } from '@jest/globals';

const verifyAdmin = jest.fn();
jest.unstable_mockModule('../utils/authMiddleware.js', () => ({
  verifyAdmin,
  logAudit: jest.fn(),
}));

const { requireAdminForNonPublicOfficialList } = await import('./officials.js');

const createResponse = () => ({
  set: jest.fn(),
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe('official directory visibility authorization', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each(['archived', 'all'])(
    'delegates the %s view to server-side admin authorization before continuing',
    (status) => {
      verifyAdmin.mockImplementation((_req, _res, next) => next());
      const req = { query: { status } };
      const res = createResponse();
      const next = jest.fn();

      requireAdminForNonPublicOfficialList(req, res, next);

      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'private, no-store, max-age=0');
      expect(verifyAdmin).toHaveBeenCalledWith(req, res, expect.any(Function));
      expect(next).toHaveBeenCalledTimes(1);
    },
  );

  it('does not continue to the database handler when admin authorization rejects', () => {
    verifyAdmin.mockImplementation((_req, res) => res.status(401).json({ message: 'Authentication failed.' }));
    const req = { query: { status: 'archived' } };
    const res = createResponse();
    const next = jest.fn();

    requireAdminForNonPublicOfficialList(req, res, next);

    expect(verifyAdmin).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it.each([undefined, 'active', 'unexpected', ['archived', 'active'], { value: 'archived' }])(
    'keeps the public active-directory path for non-private status %p',
    (status) => {
      const req = { query: status === undefined ? {} : { status } };
      const res = createResponse();
      const next = jest.fn();

      requireAdminForNonPublicOfficialList(req, res, next);

      expect(verifyAdmin).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
    },
  );
});
