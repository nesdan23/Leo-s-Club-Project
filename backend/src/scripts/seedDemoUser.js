const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '..', '..', '.env'),
});

const connectDB = require('../config/db');
const User = require('../models/User');

const DEMO_EMAIL = 'demo@leosclub.com';
const DEMO_PASSWORD = 'Demo123!';

async function seed() {
  try {
    await connectDB();
    const existing = await User.findOne({ email: DEMO_EMAIL });
    if (existing) {
      console.log('Demo user already exists:', DEMO_EMAIL);
      process.exit(0);
      return;
    }
    await User.create({
      name: 'Demo User',
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      role: 'Admin',
    });
    console.log('Demo user created.');
    console.log('  Email:', DEMO_EMAIL);
    console.log('  Password:', DEMO_PASSWORD);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
