const express = require('express');
const router = express.Router();
const {
  bulkUpload,
  getLogs,
  getStats,
  getMeta,
  getLogById,
} = require('../controllers/logController');

// Order matters: static paths (/stats, /meta, /bulk-upload) must be
// registered before the dynamic /:id route, otherwise Express would try to
// treat "stats" or "meta" as an :id value.
router.post('/bulk-upload', bulkUpload);
router.get('/stats', getStats);
router.get('/meta', getMeta);
router.get('/:id', getLogById);
router.get('/', getLogs);

module.exports = router;
