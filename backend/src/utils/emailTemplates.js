function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function frontendUrl(path) {
  const base = safeUrl(process.env.FRONTEND_URL || 'https://artistnation.studio');
  return base ? new URL(path, base).href : null;
}

function dateLabel(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short',
  });
}

function renderEmail({ title, preview, name, paragraphs, badge, code, expiry, details = [], actions = [], notice }) {
  const links = actions.map(action => ({ ...action, url: safeUrl(action.url) })).filter(action => action.url);
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  const p = value => `<p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#505568;">${escapeHtml(value)}</p>`;
  const codeHtml = code ? `<div style="margin:26px 0;padding:24px 12px;background:#f4f0ff;border:1px solid #e4d9ff;border-radius:14px;text-align:center;">
    <p style="margin:0 0 12px;color:#6b5b87;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Your one-time code</p>
    <p style="margin:0;font-family:Consolas,monospace;font-size:34px;font-weight:bold;letter-spacing:8px;color:#5423a7;">${escapeHtml(code)}</p>
    <p style="margin:14px 0 0;color:#6b5b87;font-size:13px;">Expires in ${escapeHtml(expiry)} minutes. Never share this code.</p>
  </div>` : '';
  const detailHtml = details.length ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background:#f8f9fc;border-radius:12px;">${details.map(detail => `<tr><td style="padding:14px 18px;color:#73798a;font-size:13px;vertical-align:top;">${escapeHtml(detail.label)}</td><td style="padding:14px 18px;color:#242938;font-size:14px;font-weight:bold;text-align:right;">${escapeHtml(detail.value)}</td></tr>`).join('')}</table>` : '';
  const buttons = links.map((action, index) => `<table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin:14px 0;"><tr><td align="center" bgcolor="${index ? '#f2edfa' : '#6226b5'}" style="border-radius:10px;"><a href="${escapeHtml(action.url)}" style="display:block;padding:16px 20px;color:${index ? '#5423a7' : '#ffffff'};font-size:15px;font-weight:bold;text-decoration:none;border-radius:10px;">${escapeHtml(action.label)} &rarr;</a></td></tr></table>`).join('');
  const fallbacks = links.length ? `<div style="margin:24px 0 0;padding-top:20px;border-top:1px solid #edf0f5;"><p style="font-size:12px;line-height:1.6;color:#8a90a0;margin:0 0 8px;">Button not working? Open the link below:</p>${links.map(action => `<p style="margin:4px 0;font-size:12px;line-height:1.7;overflow-wrap:anywhere;word-break:break-all;"><a href="${escapeHtml(action.url)}" style="color:#6226b5;">${escapeHtml(action.url)}</a></p>`).join('')}</div>` : '';
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(title)}</title></head>
  <body style="margin:0;padding:0;background:#f2f3f8;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(preview)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f3f8;"><tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e7e9f0;border-radius:20px;overflow:hidden;">
  <tr><td bgcolor="#201036" style="padding:30px 28px;background:#201036;"><p style="margin:0;font-size:20px;letter-spacing:2px;font-weight:bold;color:#ffffff;">ARTIST<span style="color:#c4a5ff;">NATION</span></p><p style="margin:9px 0 0;color:#c9bbdf;font-size:11px;letter-spacing:2px;">YOUR ART. YOUR STAGE.</p></td></tr>
  <tr><td style="padding:32px 28px;"><p style="margin:0 0 14px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:bold;color:#8153b7;">${escapeHtml(badge)}</p><h1 style="margin:0 0 24px;color:#252038;font-size:28px;line-height:1.3;">${escapeHtml(title)}</h1>
  ${p(greeting)}${paragraphs.map(p).join('')}${codeHtml}${detailHtml}${buttons}
  ${notice ? `<div style="margin-top:24px;padding:16px;border-left:3px solid #bca3df;background:#faf8fd;">${p(notice)}</div>` : ''}
  ${fallbacks}</td></tr>
  <tr><td style="padding:22px 28px;background:#fafbfe;border-top:1px solid #edf0f5;"><p style="margin:0;color:#71788b;font-size:12px;line-height:1.8;">Made for the artist in you.<br>The ArtistNation team</p><p style="margin:10px 0 0;color:#9399a7;font-size:11px;line-height:1.6;">This is an account notification from ArtistNation. Keep your password and verification codes private.</p></td></tr>
  </table></td></tr></table></body></html>`;
  const text = [
    'ARTISTNATION', title, '', greeting, ...paragraphs,
    ...(code ? [`Your one-time code: ${code}`, `Expires in ${expiry} minutes. Never share this code.`] : []),
    ...details.map(detail => `${detail.label}: ${detail.value}`),
    ...links.map(action => `${action.label}: ${action.url}`),
    notice, '', 'The ArtistNation team',
  ].filter(value => value !== undefined && value !== null).join('\n\n');
  return { html, text };
}

function otpEmail(name, otp, { fan = false, reset = false, siteUrl } = {}) {
  if (!/^\d{6}$/.test(String(otp))) throw new Error('A six-digit email code is required');
  const title = reset ? 'Reset your password' : 'Your next chapter starts here';
  const action = fan ? { label: 'Return to artist site', url: siteUrl }
    : { label: reset ? 'Return to sign in' : 'Continue activation', url: frontendUrl('/login') };
  return renderEmail({
    title, name, badge: reset ? 'Account security' : 'Email verification',
    preview: reset ? 'Use your secure code to choose a new password.' : 'Verify your email to finish setting up your account.',
    paragraphs: [reset ? 'We received a request to reset your password. Enter the code below in the password reset form.' : 'Welcome to ArtistNation. Enter the code below in the verification form to activate your account.'],
    code: otp, expiry: fan || reset ? 15 : 10, actions: [action],
    notice: reset ? 'If you did not request a password reset, you can ignore this email. Your password has not changed.' : 'If you did not create this account, you can ignore this email.',
  });
}

function paymentSuccessEmail(name, trialEndDate) {
  const end = dateLabel(trialEndDate);
  return renderEmail({
    title: 'You’re one step closer', badge: 'Payment confirmed', name,
    preview: 'Your setup payment is confirmed. Verify your email to activate your artist site.',
    paragraphs: ['Your $1 setup payment was successful. Your subscription includes a 14-day trial beginning at signup.', 'Check your inbox for your verification code, then complete onboarding to make your artist profile your own.'],
    details: [{ label: 'Setup payment', value: '$1.00 USD' }, ...(end ? [{ label: 'Trial ends', value: end }] : [])],
    actions: [{ label: 'Continue activation', url: frontendUrl('/login') }],
    notice: 'Your verification code arrives in a separate email. Verifying later does not extend the subscription trial.',
  });
}

function paymentFailureEmail(name) {
  return renderEmail({
    title: 'Let’s get you back on track', badge: 'Payment needs attention', name,
    preview: 'We could not complete your signup payment. Review your details and try again.',
    paragraphs: ['We could not complete your signup payment.', 'Review your card details and billing address, or try another payment method. If your bank requests authentication, follow its instructions.'],
    actions: [{ label: 'Review signup details', url: frontendUrl('/signup') }],
    notice: 'If you see a pending charge or are unsure whether payment succeeded, check with your bank before trying again.',
  });
}

function trialStartedEmail(name, trialEndDate, siteUrl) {
  const end = dateLabel(trialEndDate);
  return renderEmail({
    title: 'Your artist site is ready', badge: 'Account activated', name,
    preview: 'Your account is verified. Visit your live site and finish personalizing your profile.',
    paragraphs: ['Your email is verified and your trial is active. Complete onboarding to introduce yourself to your audience.', 'Your trial dates follow the subscription created at signup.'],
    details: end ? [{ label: 'Trial ends', value: end }] : [],
    actions: [{ label: 'Visit your live site', url: siteUrl }, { label: 'Sign in to continue setup', url: frontendUrl('/login') }],
  });
}

module.exports = { otpEmail, paymentSuccessEmail, paymentFailureEmail, trialStartedEmail };
