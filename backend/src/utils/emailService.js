
const nodemailer = require('nodemailer');

// Validate email configuration
const validateEmailConfig = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      '⚠️  Email configuration missing! EMAIL_USER and EMAIL_PASS must be set in .env file.'
    );
    console.warn(
      '   Emails will not be sent until email credentials are configured.'
    );
    return false;
  }
  return true;
};

// Create reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send volunteer credentials email
 * @param {string} email - Volunteer email address
 * @param {string} name - Volunteer name
 * @param {string} password - Generated password
 * @param {string} eventTitle - Event title
 * @returns {Promise} Email send result
 */
const sendVolunteerCredentials = async (email, name, password, eventTitle) => {
  console.log("📧 sendVolunteerCredentials called for:", email);
  // Check if email configuration is set
  if (!validateEmailConfig()) {
    return {
      success: false,
      error:
        'Email configuration missing. Please set EMAIL_USER and EMAIL_PASS in your .env file.',
    };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `Welcome to NGO EventFlow - Your Login Credentials`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 5px 5px;
          }
          .credentials {
            background-color: #fff;
            padding: 20px;
            border: 2px solid #4CAF50;
            border-radius: 5px;
            margin: 20px 0;
          }
          .credentials-item {
            margin: 10px 0;
          }
          .credentials-label {
            font-weight: bold;
            color: #555;
          }
          .credentials-value {
            font-family: monospace;
            font-size: 16px;
            color: #333;
            padding: 5px 10px;
            background-color: #f0f0f0;
            border-radius: 3px;
            display: inline-block;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #777;
            text-align: center;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to NGO EventFlow!</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          
          <p>You have been registered as a volunteer for the event: <strong>${eventTitle}</strong>.</p>
          
          <p>Your login credentials have been generated. Please use the following details to access your account:</p>
          
          <div class="credentials">
            <div class="credentials-item">
              <span class="credentials-label">Email:</span>
              <div class="credentials-value">${email}</div>
            </div>
            <div class="credentials-item">
              <span class="credentials-label">Password:</span>
              <div class="credentials-value">${password}</div>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to Your Account</a>
          </div>
          
          <div class="warning">
            <strong>Important:</strong> Please change your password after your first login for security purposes.
          </div>
          
          <p>Once logged in, you will be able to:</p>
          <ul>
            <li>View tasks assigned to you for this event</li>
            <li>Update your task progress</li>
            <li>See event details including time and location</li>
          </ul>
          
          <p>If you have any questions or need assistance, please contact your Event Manager.</p>
          
          <p>Thank you for volunteering!</p>
          
          <div class="footer">
            <p>This is an automated email from NGO EventFlow. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to NGO EventFlow!

Hello ${name},

You have been registered as a volunteer for the event: ${eventTitle}.

Your login credentials:
Email: ${email}
Password: ${password}

Login URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

Important: Please change your password after your first login for security purposes.

Once logged in, you will be able to:
- View tasks assigned to you for this event
- Update your task progress
- See event details including time and location

If you have any questions or need assistance, please contact your Event Manager.

Thank you for volunteering!

This is an automated email from NGO EventFlow. Please do not reply to this email.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    
    // Provide more helpful error messages
    let errorMessage = error.message;
    if (error.message.includes('Missing credentials')) {
      errorMessage =
        'Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in your .env file.';
    } else if (error.message.includes('Invalid login')) {
      errorMessage =
        'Invalid email credentials. Please check EMAIL_USER and EMAIL_PASS in your .env file.';
    } else if (error.message.includes('EAUTH')) {
      errorMessage =
        'Email authentication failed. Please verify your Gmail App Password is correct.';
    }
    
    return { success: false, error: errorMessage };
  }
};

module.exports = { sendVolunteerCredentials };
