const sendGridMail = require('@sendgrid/mail');
const { email } = require('../config/config');

sendGridMail.setApiKey(email.sendgridApiKey);

const sendEmail = ({ to, subject, text }) => {
  const msg = { from: email.fromEmail, to, subject, text };
  sendGridMail.send(msg);
};

module.exports = {
  sendEmail,
};
