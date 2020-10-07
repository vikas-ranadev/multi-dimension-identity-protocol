const express = require('express');
const uploadController = require('../controller/upload');
const downloadController = require('../controller/download');
const router = express.Router();

router.post('/uploadDIDdoc', uploadController.upload);
router.get('/getDIDdoc', downloadController.download);

module.exports = router;