const express = require('express');
const uploadController = require('../controller/upload');
const downloadController = require('../controller/download');
const router = express.Router();

router.post('/uploadFile', uploadController.upload);
router.get('/getFile', downloadController.download);

module.exports = router;