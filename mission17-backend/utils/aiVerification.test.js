import { isValidImageUri } from './aiVerification.js';

describe('AI Verification Utility', () => {
  describe('isValidImageUri', () => {
    it('should accept valid base64 image data URLs', () => {
      expect(isValidImageUri('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...')).toBe(true);
      expect(isValidImageUri('data:image/png;base64,iVBORw0KGgoAAAA...')).toBe(true);
      expect(isValidImageUri('data:image/webp;base64,UklGRhoAAABXRUJ...')).toBe(true);
    });

    it('should reject invalid or non-image data URLs', () => {
      expect(isValidImageUri('data:application/pdf;base64,...')).toBe(false);
      expect(isValidImageUri('data:image/bmp;base64,...')).toBe(false);
      expect(isValidImageUri('base64placeholder')).toBe(false);
    });

    it('should accept valid local /uploads/ paths', () => {
      expect(isValidImageUri('/uploads/image123.jpg')).toBe(true);
      expect(isValidImageUri('/uploads/test.png')).toBe(true);
    });

    it('should reject directory traversal in local paths', () => {
      expect(isValidImageUri('/uploads/../secret.jpg')).toBe(false);
      expect(isValidImageUri('/uploads/dir/file.jpg')).toBe(false);
      expect(isValidImageUri('/uploads/..\\secret.jpg')).toBe(false);
    });

    it('should accept valid Cloudinary HTTPS URLs', () => {
      expect(isValidImageUri('https://res.cloudinary.com/demo/image/upload/sample.jpg')).toBe(true);
      expect(isValidImageUri('https://my-custom.cloudinary.com/image.jpg')).toBe(true);
    });

    it('should reject non-Cloudinary or HTTP URLs', () => {
      expect(isValidImageUri('http://res.cloudinary.com/image.jpg')).toBe(false); // must be https
      expect(isValidImageUri('https://malicious.com/image.jpg')).toBe(false);
      expect(isValidImageUri('https://s3.amazonaws.com/image.jpg')).toBe(false);
      expect(isValidImageUri('file:///etc/passwd')).toBe(false);
    });

    it('should handle null/undefined gracefully', () => {
      expect(isValidImageUri(null)).toBe(false);
      expect(isValidImageUri(undefined)).toBe(false);
      expect(isValidImageUri('')).toBe(false);
      expect(isValidImageUri(123)).toBe(false);
    });
  });
});
