const Event = require('../models/Event');
const Task = require('../models/Task');

exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, date, location, status, attendees } = req.body;

    const event = await Event.create({
      title,
      description,
      date,
      location,
      status,
      attendees,
      manager: req.user._id,
    });

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

exports.getEvents = async (req, res, next) => {
  try {
    const events = await Event.find()
      .populate('manager', 'name email role')
      .populate('attendees', 'name email role')
      .lean();

    if (req.user.role === 'Team Member') {
      const tasks = await Task.find({
        $or: [{ assignee: req.user._id }, { assignee: null }],
      })
        .populate('assignee', 'name email')
        .lean();

      const eventsWithVolunteerView = events.map((event) => ({
        ...event,
        volunteerTasks: tasks.filter((task) => task.event?.toString() === event._id.toString()),
      }));

      return res.json(eventsWithVolunteerView);
    }

    res.json(events);
  } catch (error) {
    next(error);
  }
};

exports.getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id)
      .populate('manager', 'name email role')
      .populate('attendees', 'name email role');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (req.user.role === 'Team Member') {
      const tasks = await Task.find({
        event: id,
        $or: [{ assignee: req.user._id }, { assignee: null }],
      }).populate('assignee', 'name email');

      return res.json({
        ...event.toObject(),
        volunteerTasks: tasks,
      });
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
};

