const express = require('express');
const router = express.Router();
const { getAiTutorResponse } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// All AI routes are protected
router.use(protect);

router.post('/tutor', getAiTutorResponse);

module.exports = router;
