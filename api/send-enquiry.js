const nodemailer = require('nodemailer');

function parseBody(req){
  if (!req || !req.body) return {};
  if (typeof req.body === 'string'){
    try {
      return JSON.parse(req.body);
    } catch (err){
      return {};
    }
  }
  return req.body;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST'){
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, email, org, subject, message } = parseBody(req);
  if (!name || !email || !subject || !message){
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || 'no-reply@drelaineloo.com';

  if (!host || !port || !user || !pass){
    console.error('Email transport is not configured');
    return res.status(500).json({ error: 'Email service unavailable' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    const bodyLines = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Organization: ${org || '(not provided)'}`,
      '',
      message
    ];

    await transporter.sendMail({
      from: `Dr Elaine Loo Website <${from}>`,
      replyTo: email,
      to: 'elaine871207@gmail.com',
      subject,
      text: bodyLines.join('\n')
    });

    return res.status(200).json({ ok: true });
  } catch (err){
    console.error('send-enquiry error', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
};
