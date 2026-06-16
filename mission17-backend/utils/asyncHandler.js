// utils/asyncHandler.js
// Wraps route handlers to eliminate repetitive try/catch blocks.
// Usage: router.get('/', asyncHandler(async (req, res) => { ... }))

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
