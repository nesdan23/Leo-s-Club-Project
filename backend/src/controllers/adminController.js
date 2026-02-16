const Event = require('../models/Event');
const Task = require('../models/Task');
const User = require('../models/User');

exports.getDashboardStats = async (_req, res, next) => {
  try {
    const events = await Event.find()
      .populate('manager', 'name email')
      .lean();

    const taskStats = await Task.aggregate([
      {
        $group: {
          _id: '$event',
          totalTasks: { $sum: 1 },
          averageCompletion: { $avg: '$completionPercentage' },
        },
      },
    ]);

    const statsMap = taskStats.reduce((acc, stat) => {
      acc[stat._id?.toString() || 'none'] = stat;
      return acc;
    }, {});

    const payload = events.map((event) => {
      const stat = statsMap[event._id.toString()] || { totalTasks: 0, averageCompletion: 0 };
      return {
        event,
        totalTasks: stat.totalTasks,
        averageCompletion: Number(stat.averageCompletion.toFixed(2)),
      };
    });

    res.json({ events: payload });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (_req, res, next) => {
  try {
    const users = await User.find().select('name email role').lean();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

