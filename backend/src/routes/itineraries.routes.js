const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const itinerariesController = require('../controllers/itineraries.controller');

router.post('/', auth, itinerariesController.createTrip);
router.get('/:id', auth, itinerariesController.getTripById);
module.exports = router;