const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const getArgValue = (name) => {
  const prefix = `--${name}=`;
  const match = process.argv.find((a) => a.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
};

const email = (getArgValue('email') || process.env.ADMIN_EMAIL || 'tirthkumbhani11@gmail.com').toLowerCase();
const password = getArgValue('password') || process.env.ADMIN_PASSWORD || 'tirth11';
const name = getArgValue('name') || process.env.ADMIN_NAME || 'Tirth';

const run = async () => {
  if (!process.env.MONGODB_URI) {
    // eslint-disable-next-line no-console
    console.error('Missing MONGODB_URI in environment.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.findOneAndUpdate(
    { email },
    { name, email, password: hashedPassword, role: 'admin' },
    { new: true, upsert: true, runValidators: true }
  ).select('-password');

  // eslint-disable-next-line no-console
  console.log(`✅ Admin user ready: ${user.email} (role=${user.role})`);

  await mongoose.disconnect();
};

run().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Failed to create admin user:', err.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});


