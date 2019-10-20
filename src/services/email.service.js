const sendGridMail = require('@sendgrid/mail');
const { email: emailConfig } = require('../config/config');

sendGridMail.setApiKey(emailConfig.sendgridApiKey);

const sendEmail = async (to, subject, text) => {
  const msg = { from: emailConfig.fromEmail, to, subject, text };
  await sendGridMail.send(msg);
};

const sendResetPasswordEmail = async (to, token, baseUrl) => {
  const subject = 'Reset password';
  const text = `Dear user,
  To reset your password, send a POST request to ${baseUrl}/resetPassword?token=${token} and include the new password in the body
  If you didn't request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};

module.exports = {
  sendEmail,
  sendResetPasswordEmail,
};
