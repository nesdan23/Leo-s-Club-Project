const express = require('express');
const { createTask, getTasks, updateTask, deleteTask } = require('../controllers/taskController');
const protect = require('../middleware/authMiddleware');
const restrictTo = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.route('/').get(getTasks).post(restrictTo('Event Manager'), createTask);

router
  .route('/:id')
  .patch(updateTask)
  .delete(restrictTo('Admin', 'Event Manager'), deleteTask);

module.exports = router;

