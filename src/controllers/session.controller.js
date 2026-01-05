const { sessionService } = require('../services');
const { asyncHandler, createError } = require('../utils/helpers');
const { validateSessionSettings, validateGameType } = require('../utils/validators');

const createSession = asyncHandler(async (req, res) => {
  const { gameType, settings } = req.body;

  if (!gameType || !['everyone', 'buzzer'].includes(gameType)) {
    throw createError('Invalid game type for QR session', 400);
  }

  if (settings) {
    const validation = validateSessionSettings(settings);
    if (!validation.isValid) {
      throw createError(validation.errors.join(', '), 400);
    }
  }

  const session = await sessionService.createSession(gameType, settings);

  res.status(201).json({
    sessionId: session.sessionId,
    qrUrl: `/qr-game/${gameType}/controller?session=${session.sessionId}`
  });
});

const getSession = asyncHandler(async (req, res) => {
  const session = await sessionService.getSession(req.params.sessionId);

  if (!session) {
    throw createError('Session not found', 404);
  }

  res.json({ session });
});

const deleteSession = asyncHandler(async (req, res) => {
  const session = await sessionService.deleteSession(req.params.sessionId);

  if (!session) {
    throw createError('Session not found', 404);
  }

  res.json({ message: 'Session ended successfully' });
});

module.exports = {
  createSession,
  getSession,
  deleteSession
};
