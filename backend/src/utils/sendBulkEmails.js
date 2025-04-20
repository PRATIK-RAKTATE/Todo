// utils/sendBulkEmails.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendBulkEmails = async (recipients, subject, getHtmlContent) => {
  const results = await Promise.allSettled(recipients.map(user => {
    const html = getHtmlContent(user); // user = { name, email, password }
    return transporter.sendMail({
      // from: `"Probit Team" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      html
    });
  }));

  console.log('results - ',results);
  return results;
};

export default sendBulkEmails;
