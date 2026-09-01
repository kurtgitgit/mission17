import { jest } from '@jest/globals';
import { uploadCloudinary } from './cloudinary.js';

describe('Cloudinary Upload Configuration', () => {
  it('should accept valid image mimetypes', () => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const cb = jest.fn();

    validTypes.forEach(type => {
      const file = { mimetype: type };
      uploadCloudinary.fileFilter(null, file, cb);
      expect(cb).toHaveBeenLastCalledWith(null, true);
    });
  });

  it('should reject invalid mimetypes', () => {
    const invalidTypes = ['application/pdf', 'text/plain', 'image/bmp', 'application/json'];
    const cb = jest.fn();

    invalidTypes.forEach(type => {
      const file = { mimetype: type };
      uploadCloudinary.fileFilter(null, file, cb);
      expect(cb).toHaveBeenLastCalledWith(expect.any(Error));
      expect(cb.mock.calls[cb.mock.calls.length - 1][0].message).toBe('Only JPEG, PNG, GIF, and WebP images are allowed.');
    });
  });

  it('should have a 5MB file size limit', () => {
    expect(uploadCloudinary.limits.fileSize).toBe(5 * 1024 * 1024);
  });
});
