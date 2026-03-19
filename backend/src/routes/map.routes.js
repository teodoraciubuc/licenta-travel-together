const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mapController = require('../controllers/map.controller');

router.get ('/me',             auth, mapController.getMyMap);
router.get ('/search',         auth, mapController.searchDestinations);
router.post('/status',         auth, mapController.setMapStatus);
router.post('/remove',         auth, mapController.removeMapStatus);
router.post('/country-status', auth, mapController.setCountryStatus);
router.post('/country-remove', auth, mapController.removeCountryStatus);
router.post('/rate',           auth, mapController.rateDestination);
router.post('/suggest',        auth, mapController.suggestDestination);

module.exports = router;