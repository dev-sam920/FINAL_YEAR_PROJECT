import { sendEmail } from '../config/emailConfig.js';

export const sendSupportMessage = async (req, res) => {
  try {
    const { name, email, category, message } = req.body;

    if (!name || !email || !category || !message) {
      return res.status(400).json({ message: 'All support fields are required' });
    }

    const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
    const subject = `SmartMaint Support Request - ${category}`;
    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #111111;">
        <h2 style="color: #111111;">SmartMaint Support Request</h2>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
    `;

    await sendEmail({
      to: supportEmail,
      subject,
      html,
    });

    res.status(200).json({ message: 'Your message has been sent. Support will contact you shortly.' });
  } catch (error) {
    console.error('Support email failed:', error?.message || error);
    res.status(500).json({ message: 'Unable to send your message at this time. Please try again later.' });
  }
};
