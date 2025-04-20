// controllers/emailController.js
import sendBulkEmails from '../utils/sendBulkEmails.js';
import accountCreatedTemplate from '../templates/accountCreatedTemplate.js';

export const sendAccountInvitations = async (req, res) => {
  const { users } = req.body; // Array of { name, email, password }

  console.log('users are ', users);

  if (!users || !Array.isArray(users)) {
    return res.status(400).json({ success: false, message: 'Invalid user list' });
  }

  try {
    const subject = "Invitation to Participate in Probit – Project Management Platform";
    const result = await sendBulkEmails(users, subject, accountCreatedTemplate);
    res.status(200).json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
