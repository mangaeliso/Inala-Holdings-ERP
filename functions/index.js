const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();
const db = admin.firestore();

// SMTP Configuration
// In production, use functions.config() to store secrets:
// firebase functions:config:set gmail.email="inala.holdingz@gmail.com" gmail.password="app-password"
const gmailEmail = functions.config().gmail?.email || 'inala.holdingz@gmail.com';
const gmailPassword = functions.config().gmail?.password || 'YOUR_APP_PASSWORD_HERE';

const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

const APP_NAME = 'INALA ERP';
const APP_URL = 'https://inala-erp.web.app'; // Replace with actual domain

// --- EMAIL TEMPLATES ---

const getEmailTemplate = (title, bodyContent, logoUrl) => `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
  .header { background-color: #1e1b4b; padding: 20px; text-align: center; }
  .header img { max-height: 50px; }
  .content { padding: 30px; color: #333333; line-height: 1.6; }
  .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
  .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" alt="${APP_NAME}" />` : `<h1 style="color:white;margin:0;">${APP_NAME}</h1>`}
    </div>
    <div class="content">
      <h2 style="color: #1e1b4b; margin-top: 0;">${title}</h2>
      ${bodyContent}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. Powered by Inala Holdingz.</p>
      <p>Contact: ${gmailEmail}</p>
    </div>
  </div>
</body>
</html>
`;

// Helper to get system logo
async function getSystemLogo() {
    const doc = await db.collection('system_settings').doc('branding').get();
    return doc.exists ? doc.data().logoUrl : null;
}

// --- CLOUD FUNCTIONS ---

// 1. Send Welcome Email on User Create
exports.sendWelcomeEmail = functions.firestore.document('users/{userId}').onCreate(async (snap, context) => {
  const user = snap.data();
  const logoUrl = await getSystemLogo();
  
  const mailOptions = {
    from: `${APP_NAME} <${gmailEmail}>`,
    to: user.email,
    subject: `Welcome to ${APP_NAME}!`,
    html: getEmailTemplate(
      `Welcome, ${user.name}!`,
      `<p>We are thrilled to have you on board. Your account has been created successfully.</p>
       <p>You can now access your dashboard to manage your business or stokvel group.</p>
       <a href="${APP_URL}" class="button">Go to Dashboard</a>`,
      logoUrl
    ),
  };

  try {
    await mailTransport.sendMail(mailOptions);
    console.log('Welcome email sent to:', user.email);
  } catch (error) {
    console.error('There was an error sending the email:', error);
  }
});

// 2. Generic Email Trigger (Callable or Firestore Trigger)
// Listens to 'mail_triggers' collection to send ad-hoc emails safely
exports.processEmailTrigger = functions.firestore.document('mail_triggers/{triggerId}').onCreate(async (snap, context) => {
    const trigger = snap.data();
    const logoUrl = await getSystemLogo();
    
    let subject = '';
    let body = '';
    let to = trigger.data.email;

    switch (trigger.type) {
        case 'ACTIVATION_EMAIL':
            subject = 'Activate Your Account';
            body = `<p>Hello ${trigger.data.name},</p>
                    <p>Your account requires activation. Please click the button below to verify your email and activate your account.</p>
                    <a href="${APP_URL}/activate?token=${trigger.id}" class="button">Activate Account</a>`;
            break;
        case 'PASSWORD_RESET':
            subject = 'Reset Your Password';
            body = `<p>We received a request to reset your password. Click the link below to proceed.</p>
                    <a href="${APP_URL}/reset-password?token=${trigger.data.token}" class="button">Reset Password</a>
                    <p>If you did not request this, please ignore this email.</p>`;
            break;
        case 'PERMISSION_CHANGE':
            subject = 'Account Permissions Updated';
            body = `<p>Your account permissions have been updated by an administrator.</p>
                    <p>New Role: <strong>${trigger.data.role}</strong></p>
                    <p>Please login to see the changes.</p>`;
            break;
        default:
            return null;
    }

    const mailOptions = {
        from: `${APP_NAME} <${gmailEmail}>`,
        to: to,
        subject: subject,
        html: getEmailTemplate(subject, body, logoUrl)
    };

    try {
        await mailTransport.sendMail(mailOptions);
        return snap.ref.update({ status: 'SENT', sentAt: admin.firestore.FieldValue.serverTimestamp() });
    } catch (error) {
        console.error('Error sending triggered email:', error);
        return snap.ref.update({ status: 'FAILED', error: error.message });
    }
});
