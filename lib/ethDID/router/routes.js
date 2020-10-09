const express = require('express');
const ethController = require('../controller/didLedger');

const router = express.Router();

router.get('/read', ethController.getDID);
router.get('/readController', ethController.getController);
router.get('/nonce', ethController.getNonce);

router.post('/create', ethController.create);
router.post('/updateController', ethController.setController);
router.post('/updateCid', ethController.setMetadata);
router.post('/delete', ethController.deleteDID);

module.exports = router;
