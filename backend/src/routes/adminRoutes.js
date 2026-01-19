const express = require('express');
const { getDashboardStats } = require('../controllers/adminController');
const protect = require('../middleware/authMiddleware');
const restrictTo = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, restrictTo('Admin'));

router.get('/dashboard', getDashboardStats);

module.exports = router;

