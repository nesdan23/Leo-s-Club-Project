const XLSX = require('xlsx');
const User = require('../models/User');
const Event = require('../models/Event');
const EventVolunteer = require('../models/EventVolunteer');
const { generatePassword } = require('../utils/passwordGenerator');
const { sendVolunteerCredentials } = require('../utils/emailService');

/**
 * Import volunteers from Excel file
 * Creates new user accounts for volunteers that don't exist
 * Links existing volunteers to the event
 * Sends credentials via email to new volunteers
 */
exports.importVolunteers = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;

    // Validate file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Verify event exists and user is the manager
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if the logged-in user is the event manager
    if (event.manager.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'You can only import volunteers to events you manage',
      });
    }

    // Parse Excel file
    let workbook;
    try {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    } catch (error) {
      return res.status(400).json({
        message: 'Invalid Excel file format',
        error: error.message,
      });
    }

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    // Validate required columns
    const requiredColumns = ['Name', 'Email', 'PreferredDomain'];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(
      (col) => !(col in firstRow)
    );

    if (missingColumns.length > 0) {
      return res.status(400).json({
        message: `Missing required columns: ${missingColumns.join(', ')}`,
        requiredColumns,
      });
    }

    // Domain options from Task model
    const validDomains = [
      'Logistics',
      'Marketing',
      'General',
      'Fundraising',
      'Outreach',
      'Operations',
      'Other',
    ];

    const results = {
      created: [],
      linked: [],
      failed: [],
      emailsSent: 0,
      emailsFailed: 0,
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and we skip header

      try {
        const name = String(row.Name || '').trim();
        const email = String(row.Email || '').trim().toLowerCase();
        const preferredDomain = String(row.PreferredDomain || '').trim();

        // Validate row data
        if (!name || !email || !preferredDomain) {
          results.failed.push({
            row: rowNumber,
            email: email || 'N/A',
            reason: 'Missing required fields (Name, Email, or PreferredDomain)',
          });
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          results.failed.push({
            row: rowNumber,
            email,
            reason: 'Invalid email format',
          });
          continue;
        }

        // Validate domain
        if (!validDomains.includes(preferredDomain)) {
          results.failed.push({
            row: rowNumber,
            email,
            reason: `Invalid domain. Must be one of: ${validDomains.join(', ')}`,
          });
          continue;
        }

        // Check if user exists
        let user = await User.findOne({ email });

        if (!user) {
          // Create new user account
          const password = generatePassword(12);
          user = await User.create({
            name,
            email,
            password, // Will be hashed by pre-save hook
            role: 'Team Member',
          });

          // Send credentials email
          const emailResult = await sendVolunteerCredentials(
            email,
            name,
            password,
            event.title
          );

          if (emailResult.success) {
            results.emailsSent++;
          } else {
            results.emailsFailed++;
            console.error(`Failed to send email to ${email}:`, emailResult.error);
          }

          results.created.push({
            row: rowNumber,
            email,
            name,
            domain: preferredDomain,
            emailSent: emailResult.success,
          });
        } else {
          // User already exists
          results.linked.push({
            row: rowNumber,
            email,
            name: user.name,
            domain: preferredDomain,
          });
        }

        // Create or update EventVolunteer link
        await EventVolunteer.findOneAndUpdate(
          { event: eventId, user: user._id },
          {
            event: eventId,
            user: user._id,
            preferredDomain,
          },
          { upsert: true, new: true }
        );
      } catch (error) {
        results.failed.push({
          row: rowNumber,
          email: row.Email || 'N/A',
          reason: error.message,
        });
      }
    }

    res.status(200).json({
      message: 'Volunteer import completed',
      summary: {
        total: data.length,
        created: results.created.length,
        linked: results.linked.length,
        failed: results.failed.length,
        emailsSent: results.emailsSent,
        emailsFailed: results.emailsFailed,
      },
      details: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all volunteers for a specific event
 * Used by Event Manager to see available volunteers before task assignment
 */
exports.getEventVolunteers = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the event manager or admin
    const isManager = event.manager.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isManager && !isAdmin) {
      return res.status(403).json({
        message: 'You can only view volunteers for events you manage',
      });
    }

    // Get all volunteers for this event
    const eventVolunteers = await EventVolunteer.find({ event: eventId })
      .populate('user', 'name email role')
      .select('preferredDomain user')
      .lean();

    // Group by domain for easier filtering
    const volunteersByDomain = {};
    eventVolunteers.forEach((ev) => {
      const domain = ev.preferredDomain;
      if (!volunteersByDomain[domain]) {
        volunteersByDomain[domain] = [];
      }
      volunteersByDomain[domain].push({
        id: ev.user._id,
        name: ev.user.name,
        email: ev.user.email,
        role: ev.user.role,
      });
    });

    res.json({
      event: {
        id: event._id,
        title: event.title,
      },
      totalVolunteers: eventVolunteers.length,
      volunteersByDomain,
      allVolunteers: eventVolunteers.map((ev) => ({
        id: ev.user._id,
        name: ev.user.name,
        email: ev.user.email,
        preferredDomain: ev.preferredDomain,
      })),
    });
  } catch (error) {
    next(error);
  }
};
