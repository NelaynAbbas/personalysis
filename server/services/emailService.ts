import crypto from 'crypto';
import { Logger } from '../utils/Logger';

const logger = new Logger('EmailService');

/**
 * Email Service
 * 
 * A lightweight implementation that logs email content to the console
 * instead of actually sending emails. This removes the need for third-party
 * services like SendGrid while still providing the business logic for email
 * verification and password reset.
 */

/**
 * Generate a secure random token for email verification or password reset
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Logs an email that would have been sent for email verification
 */
export async function sendVerificationEmail(
  email: string,
  username: string,
  token: string,
  baseUrl: string
): Promise<boolean> {
  try {
    const verificationLink = `${baseUrl}/api/verify-email?token=${token}`;
    
    // Log the email that would have been sent
    logger.info(`
    [EMAIL VERIFICATION]
    To: ${email}
    Subject: Verify Your PersonalysisPro Account

    Dear ${username},

    Thank you for registering with PersonalysisPro! Please click the link below to verify your email address:
    
    ${verificationLink}
    
    This link will expire in 24 hours.
    
    If you did not create an account, please ignore this email.
    
    Best regards,
    The PersonalysisPro Team
    `);
    
    return true;
  } catch (error) {
    logger.error('Error sending verification email:', error);
    return false;
  }
}

/**
 * Logs an email that would have been sent for password reset
 */
export async function sendPasswordResetEmail(
  email: string,
  username: string,
  token: string,
  baseUrl: string
): Promise<boolean> {
  try {
    const resetLink = `${baseUrl}/reset-password?token=${token}`;
    
    // Log the email that would have been sent
    logger.info(`
    [PASSWORD RESET]
    To: ${email}
    Subject: Reset Your PersonalysisPro Password

    Dear ${username},

    We received a request to reset your password. Click the link below to set a new password:
    
    ${resetLink}
    
    This link will expire in 1 hour.
    
    If you did not request a password reset, please ignore this email.
    
    Best regards,
    The PersonalysisPro Team
    `);
    
    return true;
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    return false;
  }
}

/**
 * Logs an email that would have been sent for user invitations
 */
export async function sendInvitationEmail(
  email: string,
  inviterName: string,
  companyName: string,
  token: string,
  baseUrl: string,
  role: string
): Promise<boolean> {
  try {
    const invitationLink = `${baseUrl}/accept-invitation?token=${token}`;
    
    // Log the email that would have been sent
    logger.info(`
    [USER INVITATION]
    To: ${email}
    Subject: You've Been Invited to Join PersonalysisPro

    Hello,

    ${inviterName} has invited you to join ${companyName} on PersonalysisPro with the role of ${role}.
    
    Click the link below to accept this invitation and create your account:
    
    ${invitationLink}
    
    This invitation expires in 7 days.
    
    Best regards,
    The PersonalysisPro Team
    `);
    
    return true;
  } catch (error) {
    logger.error('Error sending invitation email:', error);
    return false;
  }
}

/**
 * Logs an email that would have been sent for account lockout notification
 */
export async function sendAccountLockoutEmail(
  email: string,
  username: string,
  unlockTime: Date
): Promise<boolean> {
  try {
    const formattedTime = unlockTime.toLocaleString();
    
    // Log the email that would have been sent
    logger.info(`
    [ACCOUNT LOCKOUT]
    To: ${email}
    Subject: Your PersonalysisPro Account Has Been Temporarily Locked

    Dear ${username},

    For security reasons, your account has been temporarily locked due to multiple failed login attempts.
    
    Your account will be automatically unlocked at ${formattedTime}.
    
    If you did not attempt to log in, please contact our support team immediately as your account may have been the target of an attack.
    
    Best regards,
    The PersonalysisPro Team
    `);
    
    return true;
  } catch (error) {
    logger.error('Error sending account lockout email:', error);
    return false;
  }
}

/**
 * Logs an email that would have been sent for welcome messages
 */
export async function sendWelcomeEmail(
  email: string,
  username: string
): Promise<boolean> {
  try {
    // Log the email that would have been sent
    logger.info(`
    [WELCOME]
    To: ${email}
    Subject: Welcome to PersonalysisPro!

    Dear ${username},

    Thank you for joining PersonalysisPro! We're excited to have you on board.
    
    Here are some resources to help you get started:
    - View your dashboard to see your business insights
    - Create your first survey to gather customer data
    - Explore our analytics tools to gain deep insights
    
    If you have any questions, our support team is always ready to help.
    
    Best regards,
    The PersonalysisPro Team
    `);
    
    return true;
  } catch (error) {
    logger.error('Error sending welcome email:', error);
    return false;
  }
}

/**
 * Get base URL for application in different environments
 */
export function getBaseUrl(req: any): string {
  // In production
  if (process.env.NODE_ENV === 'production') {
    return `${req.protocol}://${req.get('host')}`;
  }
  
  // In development
  return `http://localhost:${process.env.PORT || 5000}`;
}