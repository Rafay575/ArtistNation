// test-email.js
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,          // try 465 or 587
  secure: true,       // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  logger: true,       // log SMTP traffic
  debug: true,        // show debug output
});

// Verify connection & auth only (no email sent)
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP verification FAILED:');
    console.error(error);
  } else {
    console.log('✅ SMTP server is ready to send emails');
  }
  process.exit(0);
});