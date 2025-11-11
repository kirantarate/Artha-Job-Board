const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');

router.post('/trigger', importController.triggerImport);
router.get('/history', importController.getHistory);
router.get('/queue/stats', importController.getQueueStats);

module.exports = router;