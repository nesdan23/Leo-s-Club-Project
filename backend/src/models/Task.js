const mongoose = require('mongoose');

const statusOptions = ['Pending', 'In Progress', 'Completed'];
const domainOptions = ['Logistics', 'Marketing', 'General', 'Fundraising', 'Outreach', 'Operations', 'Other'];

const taskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: statusOptions,
      default: 'Pending',
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    domain: {
      type: String,
      enum: domainOptions,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);

