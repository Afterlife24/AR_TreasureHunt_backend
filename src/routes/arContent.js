const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { validateArContent, validateNearbyQuery, validateObjectId } = require('../middleware/validation');
const arContentController = require('../controllers/arContentController');

router.post('/', upload, validateArContent, arContentController.create);
router.get('/nearby', validateNearbyQuery, arContentController.getNearby);
router.get('/:id', validateObjectId, arContentController.getById);
router.delete('/:id', validateObjectId, arContentController.softDelete);

module.exports = router;
