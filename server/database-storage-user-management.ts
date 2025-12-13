// This file implements the user management methods for the DatabaseStorage class
import { eq, and, desc, sql } from "drizzle-orm";
import { db, executeWithRetry } from "./db";
import { 
  users, 
  userActivityLogs, 
  userInvitations, 
  type User
} from "../shared/schema";
import { hashPassword, verifyPassword } from "./auth";
import { generateSecureToken } from "./services/emailService";
import { Logger } from "./utils/Logger";

const logger = new Logger('DatabaseStorageUserManagement');
import crypto from "crypto";

/**
 * User Management Methods
 * These methods should be incorporated into the DatabaseStorage class
 */

// User retrieval methods
export async function getUserById(id: number): Promise<User | undefined> {
  try {
    // Use executeWithRetry to handle transient connection errors
    const result = await executeWithRetry(async () => {
      return await db.select().from(users).where(eq(users.id, id));
    });
    return result[0];
  } catch (error) {
    logger.error(`Error getting user by ID ${id}:`, error);
    return undefined;
  }
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  try {
    const result = await executeWithRetry(async () => {
      return await db.select().from(users).where(eq(users.username, username));
    });
    return result[0];
  } catch (error) {
    logger.error(`Error getting user by username ${username}:`, error);
    return undefined;
  }
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  try {
    const result = await executeWithRetry(async () => {
      return await db.select().from(users).where(eq(users.email, email));
    });
    return result[0];
  } catch (error) {
    logger.error(`Error getting user by email ${email}:`, error);
    return undefined;
  }
}

// User creation and update methods
export async function createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  try {
    // Add password hashing if password is provided
    if (userData.password) {
      const { hash, salt } = hashPassword(userData.password);
      userData.password = hash;
      userData.passwordSalt = salt;
    }
    
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  } catch (error) {
    logger.error(`Error creating user:`, error);
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

export async function updateUser(id: number, data: Partial<Omit<User, 'id'>>): Promise<User | undefined> {
  try {
    // Add password hashing if password is being updated
    if (data.password) {
      const { hash, salt } = hashPassword(data.password);
      data.password = hash;
      data.passwordSalt = salt;
      data.passwordLastChanged = new Date();
    }
    
    // Add updatedAt timestamp
    data.updatedAt = new Date();
    
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
      
    return updatedUser;
  } catch (error) {
    logger.error(`Error updating user ${id}:`, error);
    return undefined;
  }
}

export async function deactivateUser(id: number): Promise<User | undefined> {
  try {
    const [deactivatedUser] = await db
      .update(users)
      .set({ 
        isActive: false, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
      
    return deactivatedUser;
  } catch (error) {
    logger.error(`Error deactivating user ${id}:`, error);
    return undefined;
  }
}

// Password reset functionality
export async function setPasswordResetToken(userId: number, token: string, expiryHours: number): Promise<boolean> {
  try {
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + expiryHours);
    
    await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetTokenExpiry: expiryDate,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
      
    return true;
  } catch (error) {
    logger.error(`Error setting password reset token for user ${userId}:`, error);
    return false;
  }
}

export async function validatePasswordResetToken(token: string): Promise<User | undefined> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.passwordResetToken, token),
          sql`${users.passwordResetTokenExpiry} > NOW()`
        )
      );
      
    return user;
  } catch (error) {
    logger.error(`Error validating password reset token:`, error);
    return undefined;
  }
}

export async function resetPassword(userId: number, newPassword: string): Promise<boolean> {
  try {
    const { hash, salt } = hashPassword(newPassword);
    
    await db
      .update(users)
      .set({
        password: hash,
        passwordSalt: salt,
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
        passwordLastChanged: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
      
    return true;
  } catch (error) {
    logger.error(`Error resetting password for user ${userId}:`, error);
    return false;
  }
}

// Email verification functionality
export async function setEmailVerificationToken(userId: number, token: string, expiryHours: number): Promise<boolean> {
  try {
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + expiryHours);
    
    await db
      .update(users)
      .set({
        emailVerificationToken: token,
        emailVerificationTokenExpiry: expiryDate,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
      
    return true;
  } catch (error) {
    logger.error(`Error setting email verification token for user ${userId}:`, error);
    return false;
  }
}

export async function verifyEmail(token: string): Promise<boolean> {
  try {
    // Find the user with this token and valid expiry
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.emailVerificationToken, token),
          sql`${users.emailVerificationTokenExpiry} > NOW()`
        )
      );
      
    if (!user) {
      return false;
    }
    
    // Mark email as verified and clear token
    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));
      
    return true;
  } catch (error) {
    logger.error(`Error verifying email with token:`, error);
    return false;
  }
}

// User activity logging
export async function logUserActivity(
  userId: number, 
  action: string, 
  details: any = {}, 
  ipAddress?: string, 
  userAgent?: string
): Promise<void> {
  try {
    await db.insert(userActivityLogs).values({
      userId,
      action,
      details,
      ipAddress,
      userAgent,
      createdAt: new Date()
    });
  } catch (error) {
    logger.error(`Error logging user activity for user ${userId}:`, error);
  }
}

export async function getUserActivityLogs(userId: number, limit: number = 100): Promise<any[]> {
  try {
    const logs = await db
      .select()
      .from(userActivityLogs)
      .where(eq(userActivityLogs.userId, userId))
      .orderBy(desc(userActivityLogs.createdAt))
      .limit(limit);
      
    return logs;
  } catch (error) {
    logger.error(`Error getting activity logs for user ${userId}:`, error);
    return [];
  }
}

// User invitations
export async function createUserInvitation(
  email: string, 
  role: string, 
  companyId: number, 
  invitedBy: number
): Promise<any> {
  try {
    // Generate a secure invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 days validity
    
    const [invitation] = await db
      .insert(userInvitations)
      .values({
        email,
        role,
        companyId,
        invitedBy,
        token,
        expiresAt: expiryDate,
        createdAt: new Date()
      })
      .returning();
      
    return invitation;
  } catch (error) {
    logger.error(`Error creating user invitation for ${email}:`, error);
    throw new Error(`Failed to create invitation: ${error.message}`);
  }
}

export async function getInvitationByToken(token: string): Promise<any | undefined> {
  try {
    const [invitation] = await db
      .select()
      .from(userInvitations)
      .where(
        and(
          eq(userInvitations.token, token),
          sql`${userInvitations.expiresAt} > NOW()`,
          eq(userInvitations.status, 'pending')
        )
      );
      
    return invitation;
  } catch (error) {
    logger.error(`Error getting invitation by token:`, error);
    return undefined;
  }
}

export async function acceptInvitation(token: string, userData: Partial<User>): Promise<User | undefined> {
  try {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Get the invitation
      const [invitation] = await tx
        .select()
        .from(userInvitations)
        .where(
          and(
            eq(userInvitations.token, token),
            sql`${userInvitations.expiresAt} > NOW()`,
            eq(userInvitations.status, 'pending')
          )
        );
        
      if (!invitation) {
        throw new Error('Invalid or expired invitation');
      }
      
      // Create the user
      const userToCreate = {
        ...userData,
        email: invitation.email,
        role: invitation.role,
        companyId: invitation.companyId,
        emailVerified: true, // Auto-verify email since they accepted an invitation
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Hash password if provided
      if (userToCreate.password) {
        const { hash, salt } = hashPassword(userToCreate.password);
        userToCreate.password = hash;
        userToCreate.passwordSalt = salt;
      }
      
      // Insert user
      const [user] = await tx
        .insert(users)
        .values(userToCreate)
        .returning();
        
      // Mark invitation as accepted
      await tx
        .update(userInvitations)
        .set({
          status: 'accepted',
          acceptedAt: new Date(),
          acceptedById: user.id
        })
        .where(eq(userInvitations.id, invitation.id));
        
      // Log this activity
      await tx
        .insert(userActivityLogs)
        .values({
          userId: user.id,
          action: 'invitation_accepted',
          details: { invitationId: invitation.id },
          createdAt: new Date()
        });
        
      return user;
    });
  } catch (error) {
    logger.error(`Error accepting invitation:`, error);
    return undefined;
  }
}