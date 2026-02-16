const express = require('express');
const { getDashboardStats, getUsers } = require('../controllers/adminController');
const protect = require('../middleware/authMiddleware');
const restrictTo = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/dashboard', restrictTo('Admin'), getDashboardStats);
router.get('/users', restrictTo('Admin', 'Event Manager'), getUsers);

module.exports = router;

