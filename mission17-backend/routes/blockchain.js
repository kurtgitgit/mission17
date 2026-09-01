import express from 'express';

const router = express.Router();

/**
 * This endpoint previously accepted arbitrary public requests and used the
 * server relayer wallet to create transactions. It is intentionally retired.
 * Blockchain writes must be triggered only by an authenticated server-side
 * business action after that action has been authorized and persisted.
 */
router.post('/record', (_req, res) => {
  res.status(410).json({
    message: 'Direct blockchain recording is retired. Use an authorized business workflow instead.'
  });
});

export default router;
