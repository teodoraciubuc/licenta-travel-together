const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const itinerariesController = require('../controllers/itineraries.controller');

router.post('/', auth, itinerariesController.createTrip);
router.get('/:id', auth, itinerariesController.getTripById);
router.get('/:id/recommendations', auth, itinerariesController.getRecommendations);
router.post('/:id/items',  auth, itinerariesController.addItem);
router.get('/:id/search-poi', auth, itinerariesController.searchPOI);
module.exports = router;