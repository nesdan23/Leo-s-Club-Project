const Task = require('../models/Task');
const Event = require('../models/Event');

exports.createTask = async (req, res, next) => {
  try {
    const { name, description, event, assignee, status, completionPercentage, dueDate, domain } = req.body;

    const existingEvent = await Event.findById(event);
    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const task = await Task.create({
      name,
      description,
      event,
      assignee,
      status,
      completionPercentage,
      dueDate,
      domain,
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

exports.getTasks = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'Admin') {
      // Admin sees all tasks
      query = {};
    } else if (req.user.role === 'Event Manager') {
      // Event Manager sees all tasks for events they manage
      const eventsManaged = await Event.find({ manager: req.user._id }).select('_id').lean();
      const eventIds = eventsManaged.map((e) => e._id);
      query = { event: { $in: eventIds } };
    } else {
      // Team Member sees only tasks assigned to them
      query = { assignee: req.user._id };
    }

    const tasks = await Task.find(query)
      .populate('event', 'title date status manager')
      .populate('assignee', 'name email');

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.role === 'Team Member') {
      if (!task.assignee || task.assignee.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only update tasks assigned to you' });
      }

      const updates = {};
      if (req.body.status) updates.status = req.body.status;
      if (typeof req.body.completionPercentage === 'number') {
        updates.completionPercentage = req.body.completionPercentage;
      }

      Object.assign(task, updates);
    } else {
      Object.assign(task, req.body);
    }

    await task.save();
    res.json(task);
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

