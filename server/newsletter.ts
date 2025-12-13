import express, { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { newsletterSubscribers } from '../shared/schema';
import { insertNewsletterSubscriberSchema } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

const router = express.Router();

// Subscribe to newsletter
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    
    // Validate email
    const validationResult = insertNewsletterSubscriberSchema.safeParse({
      email,
      name,
      subscriptionSource: req.body.source || 'website_footer',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    if (!validationResult.success) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid email address',
        errors: validationResult.error.errors
      });
    }

    // Check if email already exists
    const existingSubscriber = await db.select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1);

    if (existingSubscriber.length > 0) {
      // If already subscribed, just return success
      if (existingSubscriber[0].subscribed) {
        return res.status(200).json({ 
          status: 'success', 
          message: 'You are already subscribed to our newsletter!' 
        });
      }
      
      // If previously unsubscribed, resubscribe them
      await db.update(newsletterSubscribers)
        .set({ 
          subscribed: true,
          subscribedAt: new Date(),
          unsubscribedAt: null
        })
        .where(eq(newsletterSubscribers.email, email));
      
      return res.status(200).json({ 
        status: 'success', 
        message: 'You have been resubscribed to our newsletter!' 
      });
    }

    // Generate confirmation token
    const confirmationToken = randomBytes(32).toString('hex');

    // Insert new subscriber
    const [subscriber] = await db.insert(newsletterSubscribers)
      .values({
        email,
        name: name || null,
        subscriptionSource: req.body.source || 'website_footer',
        confirmationToken,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      })
      .returning();

    // In a real implementation, you would send a confirmation email here
    // For now, we'll just mark them as confirmed automatically
    await db.update(newsletterSubscribers)
      .set({ confirmed: true })
      .where(eq(newsletterSubscribers.id, subscriber.id));

    res.status(201).json({ 
      status: 'success', 
      message: 'Thank you for subscribing to our newsletter!' 
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'An error occurred while processing your subscription. Please try again.' 
    });
  }
});

// Unsubscribe from newsletter
router.post('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { email, token } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Email address is required' 
      });
    }

    const subscriber = await db.select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1);

    if (subscriber.length === 0) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Email address not found in our subscriber list' 
      });
    }

    // Update subscriber status
    await db.update(newsletterSubscribers)
      .set({ 
        subscribed: false,
        unsubscribedAt: new Date()
      })
      .where(eq(newsletterSubscribers.email, email));

    res.status(200).json({ 
      status: 'success', 
      message: 'You have been unsubscribed from our newsletter.' 
    });
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'An error occurred while processing your request. Please try again.' 
    });
  }
});

export default router;