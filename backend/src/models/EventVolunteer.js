const mongoose = require('mongoose');

const domainOptions = ['Logistics', 'Marketing', 'General', 'Fundraising', 'Outreach', 'Operations', 'Other'];

const eventVolunteerSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    preferredDomain: {
      type: String,
      enum: domainOptions,
      required: true,
    },
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate volunteer-event links
eventVolunteerSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('EventVolunteer', eventVolunteerSchema);
