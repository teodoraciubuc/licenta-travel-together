const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mapController = require('../controllers/map.controller');

// Rutele apelate din MapPage.jsx si DashboardPage.jsx
router.get('/me', auth, mapController.getMyMap);
router.get('/search', auth, mapController.searchDestinations);
router.post('/status', auth, mapController.setMapStatus);
router.post('/remove', auth, mapController.removeMapStatus);

// Rute suplimentare expuse de controller
router.post('/country/status', auth, mapController.setCountryStatus);
router.post('/country/remove', auth, mapController.removeCountryStatus);

module.exports = router;