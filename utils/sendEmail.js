// utils/sendEmail.js
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, body) => {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL, // Must be a verified sender in SendGrid
    subject,
    text: body
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error.response?.body || error);
    throw new Error('Failed to send email');
  }
};

module.exports = sendEmail;