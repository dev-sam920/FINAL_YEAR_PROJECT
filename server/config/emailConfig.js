import nodemailer from 'nodemailer';

/**
 * Note: transporter is created inside `sendEmail` to ensure environment
 * variables are loaded before attempting to create SMTP credentials.
 */

/**
 * Simple HTML welcome email template
 * @param {string} fullName
 * @returns {string} HTML string
 */
export const welcomeEmailTemplate = (fullName) => {
  const name = fullName || 'Friend';

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </head>
      <body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" style="width:100%;height:100%;background:#ffffff;">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width:600px;width:100%;margin:40px 16px;padding:24px;border-radius:8px;border:1px solid #f1f5f9;">
                <tr>
                  <td style="text-align:center;padding-bottom:16px;">
                    <h1 style="margin:0;color:#111111;font-size:24px;">Welcome to SmartMaint, ${name}!</h1>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;padding:12px 0;color:#4b5563;">
                    <p style="margin:0 0 12px 0;line-height:1.4;">Thanks for creating an account — we're excited to help you manage your properties and maintenance requests.</p>
                    <p style="margin:0;color:#111111;">Get started by logging into your account and submitting your first request.</p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;padding-top:20px;">
                    <a href="${process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/login` : '#'}" style="display:inline-block;padding:10px 18px;border-radius:6px;background:#F5A623;color:#ffffff;text-decoration:none;font-weight:600;">Log in to SmartMaint</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:20px;text-align:center;color:#9CA3AF;font-size:12px;">© ${new Date().getFullYear()} SmartMaint</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

export const paymentDueEmailTemplate = (clientName, requestTitle, jobCost, platformFee, totalAmount, paymentLink) => {
  const name = clientName || 'there';
  const safeRequestTitle = requestTitle || 'your maintenance request';
  const safePaymentLink = paymentLink || (process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/my-requests` : '#');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </head>
      <body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" style="width:100%;height:100%;background:#ffffff;">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width:600px;width:100%;margin:40px 16px;padding:24px;border-radius:8px;border:1px solid #f1f5f9;">
                <tr>
                  <td style="text-align:left;padding-bottom:16px;">
                    <h1 style="margin:0;color:#111111;font-size:24px;">Hi ${name}, your maintenance request '${safeRequestTitle}' has been completed!</h1>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:left;padding:12px 0;color:#4b5563;line-height:1.6;">
                    <p style="margin:0 0 12px 0;">A technician has finalized the job and your payment is now due.</p>
                    <table role="presentation" style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e5e7eb;">
                      <tr>
                        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#111111;">Service Cost</td>
                        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#111111;font-weight:600;">₦${Number(jobCost || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#111111;">Platform Fee (10%)</td>
                        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#111111;font-weight:600;">₦${Number(platformFee || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 12px;color:#111111;font-weight:700;">Total Due</td>
                        <td style="padding:10px 12px;color:#111111;font-weight:700;">₦${Number(totalAmount || 0).toLocaleString()}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;padding-top:12px;">
                    <a href="${safePaymentLink}" style="display:inline-block;padding:10px 18px;border-radius:6px;background:#F5A623;color:#ffffff;text-decoration:none;font-weight:600;">Pay Now</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:20px;text-align:left;color:#4b5563;line-height:1.6;">
                    <p style="margin:0;">Thank you for using SmartMaint.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:20px;text-align:center;color:#9CA3AF;font-size:12px;">© ${new Date().getFullYear()} SmartMaint</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

export const paymentReceivedEmailTemplate = (clientName, requestTitle, amountPaid) => {
  const name = clientName || 'there';
  const safeRequestTitle = requestTitle || 'your maintenance request';

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </head>
      <body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" style="width:100%;height:100%;background:#ffffff;">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width:600px;width:100%;margin:40px 16px;padding:24px;border-radius:8px;border:1px solid #f1f5f9;">
                <tr>
                  <td style="text-align:left;padding-bottom:16px;">
                    <h1 style="margin:0;color:#111111;font-size:24px;">Payment Received - SmartMaint</h1>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:left;padding:12px 0;color:#4b5563;line-height:1.6;">
                    <p style="margin:0 0 12px 0;">Hi ${name}, we’ve received your payment for '${safeRequestTitle}'.</p>
                    <p style="margin:0 0 12px 0;">Amount paid: <strong>₦${Number(amountPaid || 0).toLocaleString()}</strong></p>
                    <p style="margin:0;">Thank you for choosing SmartMaint.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:20px;text-align:center;color:#9CA3AF;font-size:12px;">© ${new Date().getFullYear()} SmartMaint</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

/**
 * Send an email using the configured transporter.
 * Errors are logged but not re-thrown so sending failures don't break main flows.
 */
export const technicianWelcomeEmailTemplate = ({ fullName, email, password, loginUrl }) => {
  const name = fullName || 'Technician';
  const safeLoginUrl = loginUrl || (process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/login` : '#');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </head>
      <body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" style="width:100%;height:100%;background:#ffffff;">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width:600px;width:100%;margin:40px 16px;padding:24px;border-radius:8px;border:1px solid #f1f5f9;">
                <tr>
                  <td style="text-align:center;padding-bottom:16px;">
                    <h1 style="margin:0;color:#111111;font-size:24px;">Welcome to SmartMaint, ${name}!</h1>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;padding:12px 0;color:#4b5563;">
                    <p style="margin:0 0 12px 0;line-height:1.4;">An administrator created your technician account for SmartMaint.</p>
                    <p style="margin:0 0 8px 0;line-height:1.4;"><strong>Email:</strong> ${email}</p>
                    <p style="margin:0 0 8px 0;line-height:1.4;"><strong>Temporary password:</strong> ${password}</p>
                    <p style="margin:0 0 16px 0;line-height:1.4;">Please change your password after logging in for the first time.</p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;padding-top:10px;">
                    <a href="${safeLoginUrl}" style="display:inline-block;padding:10px 18px;border-radius:6px;background:#F5A623;color:#ffffff;text-decoration:none;font-weight:600;">Log in to SmartMaint</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:20px;text-align:center;color:#9CA3AF;font-size:12px;">© ${new Date().getFullYear()} SmartMaint</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

export async function sendEmail({ to, subject, html }) {
  try {
    // create transporter at call-time so process.env values are available
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"SmartMaint" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log('Welcome email sent:', info.messageId);
  } catch (error) {
    console.error('Failed to send email:', error?.message || error);
  }
}

export default sendEmail;
