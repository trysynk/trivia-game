const express = require('express');
const router = express.Router();
const { sessionController } = require('../controllers');

router.post('/create', sessionController.createSession);
router.get('/:sessionId', sessionController.getSession);
router.delete('/:sessionId', sessionController.deleteSession);

module.exports = router;
