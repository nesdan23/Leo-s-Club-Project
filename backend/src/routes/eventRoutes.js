const express = require('express');
const multer = require('multer');
const { createEvent, getEvents, getEventById } = require('../controllers/eventController');
const { importVolunteers, getEventVolunteers } = require('../controllers/volunteerController');
const protect = require('../middleware/authMiddleware');
const restrictTo = require('../middleware/roleMiddleware');
const uploadExcel = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.route('/').get(getEvents).post(restrictTo('Admin', 'Event Manager'), createEvent);

// Volunteer import route (must be before /:id to avoid route conflicts)
router.post(
  '/:id/volunteers/import',
  restrictTo('Admin', 'Event Manager'),
  (req, res, next) => {
    uploadExcel(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
          }
          return res.status(400).json({ message: err.message });
        }
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  importVolunteers
);

// Get event volunteers route
router.get('/:id/volunteers', getEventVolunteers);

router.route('/:id').get(getEventById);

module.exports = router;

