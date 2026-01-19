const express = require('express');
const { createEvent, getEvents, getEventById } = require('../controllers/eventController');
const protect = require('../middleware/authMiddleware');
const restrictTo = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.route('/').get(getEvents).post(restrictTo('Event Manager'), createEvent);

router.route('/:id').get(getEventById);

module.exports = router;

