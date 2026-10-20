const nodemailer = require('nodemailer');
const { randomUUID } = require('crypto');
const templates = require('./emailTemplates');

const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = SMTP_PORT === 465;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  requireTLS: !SMTP_SECURE,
  pool: true,
  maxConnections: 3,
  maxMessages: 50,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

function validateConfiguration() {
  if (!process.env.SMTP_HOST || !Number.isInteger(SMTP_PORT) || SMTP_PORT < 1 || SMTP_PORT > 65535) {
    throw new Error('SMTP_HOST and a valid SMTP_PORT are required');
  }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) throw new Error('SMTP credentials are required');
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(process.env.EMAIL_FROM || '')) {
    throw new Error('EMAIL_FROM must be a valid sender email address');
  }
}

function canRetry(error) {
  // An explicit temporary SMTP rejection means the server did not accept the email.
  if (error.responseCode >= 400 && error.responseCode < 500) return true;
  // A disconnect after DATA may mean delivery succeeded: retrying could duplicate it.
  if (['EDNS', 'ECONNECTION', 'ECONNREFUSED'].includes(error.code)) return true;
  return ['ECONNRESET', 'ETIMEDOUT', 'ESOCKET'].includes(error.code)
    && ['CONN', 'CONNECT', 'EHLO', 'HELO', 'STARTTLS', 'AUTH'].includes(error.command);
}

async function sendMailWithRetry(options, retries = 3) {
  validateConfiguration();
  const message = { ...options, messageId: `<${randomUUID()}@artistnation.studio>` };
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await transporter.sendMail(message);
      if (!result.accepted?.some(address => String(address).toLowerCase() === options.to.toLowerCase())) {
        const error = new Error('Email recipient was not accepted by the mail server');
        error.code = 'EENVELOPE';
        throw error;
      }
      return result;
    } catch (error) {
      if (canRetry(error) && attempt < retries) {
        console.warn(`[mailer] retry ${attempt}/${retries}: ${error.code || error.responseCode || 'SMTP_ERROR'}`);
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        continue;
      }
      // Avoid logging message contents, email addresses, codes or SMTP credentials.
      console.error('[mailer] send failed:', error.code || error.responseCode || 'SMTP_ERROR');
      throw error;
    }
  }
}

function sendNotification(email, subject, content) {
  if (typeof email !== 'string' || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email)) {
    return Promise.reject(new Error('A valid recipient email address is required'));
  }
  return sendMailWithRetry({
    from: { name: 'ArtistNation', address: process.env.EMAIL_FROM },
    to: email,
    subject,
    ...content,
  });
}

exports.sendOTPEmail = (email, name, otp) => sendNotification(
  email, 'Verify your email – ArtistNation', templates.otpEmail(name, otp),
);

exports.sendPaymentSuccessEmail = (email, name, trialEndDate) => sendNotification(
  email, 'Payment confirmed – ArtistNation', templates.paymentSuccessEmail(name, trialEndDate),
);

// Preserve the existing call signature without exposing raw processor errors in email.
exports.sendPaymentFailureEmail = (email, name, _errorMessage) => sendNotification(
  email, 'Payment needs attention – ArtistNation', templates.paymentFailureEmail(name),
);

exports.sendTrialStartedEmail = (email, name, trialEndDate, siteUrl) => sendNotification(
  email, 'Your artist site is ready – ArtistNation', templates.trialStartedEmail(name, trialEndDate, siteUrl),
);

exports.sendResetOTPEmail = (email, name, otp) => sendNotification(
  email, 'Password reset code – ArtistNation', templates.otpEmail(name, otp, { reset: true }),
);

exports.sendFanOTPEmail = (email, name, otp, purpose = 'verify', context = {}) => sendNotification(
  email, purpose === 'verify' ? 'Verify your email – ArtistNation' : 'Password reset – ArtistNation',
  templates.otpEmail(name, otp, { fan: true, reset: purpose !== 'verify', siteUrl: context.siteUrl }),
);
