import express from 'express';
import { db, pool } from '../db';
import { 
  collaborationSessions, 
  collaborationParticipants, 
  collaborationComments, 
  collaborationChanges,
  surveys,
  users
} from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getWebSocketService } from '../utils/websocketService';

// Helper function to generate random hex color
function getRandomColor(): string {
  const colors = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#33FFF5', 
    '#F5FF33', '#FF5733', '#C70039', '#900C3F', '#581845', 
    '#FFC300', '#2ECC71', '#3498DB', '#9B59B6', '#1ABC9C'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

const router = express.Router();

// Join or create a session
router.post('/:sessionId/join', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId, username } = req.body;
    
    if (!userId || !username) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: userId and username are required'
      });
    }
    
    // Validate session ID
    const parsedSessionId = parseInt(sessionId);
    if (isNaN(parsedSessionId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid session ID'
      });
    }
    
    // Check if session exists, and create it if it doesn't
    let session = await db.query.collaborationSessions.findFirst({
      where: eq(collaborationSessions.id, parsedSessionId)
    });

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found'
      });
    }
    
    // Generate a connection ID for the participant
    const connectionId = uuidv4();
    
    // Check if the user is already a participant
    const existingParticipant = await db.query.collaborationParticipants.findFirst({
      where: and(
        eq(collaborationParticipants.sessionId, parsedSessionId),
        eq(collaborationParticipants.userId, userId)
      )
    });
    
    if (existingParticipant) {
      // Update the existing participant record
      await db.update(collaborationParticipants)
        .set({
          lastActiveAt: new Date(),
          status: 'online',
        })
        .where(and(
          eq(collaborationParticipants.sessionId, parsedSessionId),
          eq(collaborationParticipants.userId, userId)
        ));
    } else {
      // Add the user as a new participant
      await db.insert(collaborationParticipants)
        .values({
          sessionId: parsedSessionId,
          userId,
          role: 'editor',
          status: 'online',
          lastActiveAt: new Date(),
          color: getRandomColor(),
          cursor: { x: 0, y: 0 },
          createdAt: new Date(),
          updatedAt: new Date()
        });
    }
    
    // Update the session's last active timestamp
    await db.update(collaborationSessions)
      .set({
        lastActiveAt: new Date()
      })
      .where(eq(collaborationSessions.id, parsedSessionId));
    
    // Fetch the latest session data
    session = await db.query.collaborationSessions.findFirst({
      where: eq(collaborationSessions.id, parsedSessionId)
    });
    
    // Notify other participants about the new user
    const wsService = getWebSocketService();
    if (wsService) {
      wsService.broadcastToSession(parsedSessionId, {
        type: 'participant_joined',
        userId,
        username,
        sessionId: parsedSessionId,
        timestamp: new Date()
      });
    }
    
    return res.json({
      status: 'success',
      data: {
        session,
        connectionId
      }
    });
  } catch (error) {
    console.error('Error joining collaboration session:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to join collaboration session'
    });
  }
});

// Get all collaboration sessions
router.get('/', async (_req, res) => {
  try {
    const sessions = await db.select({
      id: collaborationSessions.id,
      title: collaborationSessions.title,
      description: collaborationSessions.description,
      surveyId: collaborationSessions.surveyId,
      createdById: collaborationSessions.createdById,
      isActive: collaborationSessions.isActive,
      lastActiveAt: collaborationSessions.lastActiveAt,
      createdAt: collaborationSessions.createdAt,
      updatedAt: collaborationSessions.updatedAt
    })
    .from(collaborationSessions)
    .orderBy(desc(collaborationSessions.createdAt));
    
    // For each session, get the creator's info and the number of participants
    const sessionsWithDetails = await Promise.all(sessions.map(async (session) => {
      // Count participants
      const participants = await db.query.collaborationParticipants.findMany({
        where: eq(collaborationParticipants.sessionId, session.id)
      });
      
      // Get creator information
      let creatorUsername = "Unknown User";
      try {
        const [creator] = await db.select().from(users).where(eq(users.id, session.createdById));
        if (creator) {
          creatorUsername = creator.username;
        }
      } catch (e) {
        console.warn(`Could not find creator with ID ${session.createdById}:`, e);
      }
      
      return {
        id: session.id,
        title: session.title,
        description: session.description,
        surveyId: session.surveyId,
        createdById: session.createdById,
        createdByUsername: creatorUsername,
        isActive: session.isActive,
        lastActiveAt: session.lastActiveAt,
        participantCount: participants.length,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      };
    }));
    
    return res.json({
      status: 'success',
      data: sessionsWithDetails
    });
  } catch (error) {
    console.error('Error fetching collaboration sessions:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch collaboration sessions'
    });
  }
});

// Create a new session (added functionality)
router.post('/', async (req, res) => {
  try {
    const { title, description, userId, username, surveyId } = req.body;
    
    if (!title || !userId || !username) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: title, userId, and username'
      });
    }
    
    // Get all surveys in the system
    const existingSurveys = await db.select({ id: surveys.id })
      .from(surveys)
      .orderBy(surveys.id);
    
    // Always log what was received from the client for debugging
    console.log(`Received surveyId from client: ${surveyId}`);
    
    // Check if the surveyId exists in our database
    let targetSurveyId = 3; // Default fallback if all else fails
    
    if (surveyId) {
      // If client provided a surveyId, verify it exists
      const surveyExists = existingSurveys.some(survey => survey.id === surveyId);
      if (surveyExists) {
        targetSurveyId = surveyId;
      } else {
        console.log(`Client provided surveyId ${surveyId} does not exist, using default`);
      }
    } else if (existingSurveys.length > 0) {
      // No surveyId provided, but we have surveys - use the first one
      targetSurveyId = existingSurveys[0].id;
    } else {
      // No surveys exist at all - create one
      const [newSurvey] = await db.insert(surveys)
        .values({
          title: 'Default Survey',
          description: 'This is a default survey',
          createdById: userId,
          companyId: 1, // Adding required company ID
          isActive: true,
          surveyType: 'general', // Adding required survey type
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      targetSurveyId = newSurvey.id;
    }
    
    console.log(`Creating session with survey ID: ${targetSurveyId}`);
    
    // Use raw SQL with the pool client instead since the schema and database are mismatched
    console.log("Executing raw SQL insert for collaboration session via pool");
    const now = new Date().toISOString();
    const queryText = `
      INSERT INTO collaboration_sessions 
        (title, description, created_by_id, survey_id, is_active, last_active_at, metadata, created_at, updated_at)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      title,
      description || '',
      userId,
      targetSurveyId,
      true,
      now,
      JSON.stringify({
        initialContent: '# New Collaboration Session\n\nStart collaborating here...'
      }),
      now,
      now
    ];
    
    // Pool is already imported at the top of the file
    const rawInsertResult = await pool.query(queryText, values);
    
    console.log("Raw insert result:", rawInsertResult);
    const session = rawInsertResult.rows[0];
    
    // Add the creator as the first participant - using the pool directly for raw SQL
    const color = getRandomColor();
    const participantQueryText = `
      INSERT INTO collaboration_participants
        (session_id, user_id, status, last_active_at, role, color, cursor, created_at, updated_at, joined_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    
    const participantValues = [
      session.id,
      userId,
      'online',
      now,
      'editor',
      color,
      JSON.stringify({ x: 0, y: 0 }),
      now,
      now,
      now
    ];
    
    // Use the pool directly
    await pool.query(participantQueryText, participantValues);
    
    return res.json({
      status: 'success',
      data: { 
        session,
        message: 'Session created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating collaboration session:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create collaboration session'
    });
  }
});

// Get a specific session with participants and comments
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Validate session ID
    const parsedSessionId = parseInt(sessionId);
    if (isNaN(parsedSessionId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid session ID'
      });
    }
    
    // Get the session
    const session = await db.query.collaborationSessions.findFirst({
      where: eq(collaborationSessions.id, parsedSessionId)
    });
    
    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found'
      });
    }
    
    // Get all participants
    const participants = await db.query.collaborationParticipants.findMany({
      where: eq(collaborationParticipants.sessionId, parsedSessionId)
    });
    
    // Get the latest change
    const latestChange = await db.query.collaborationChanges.findFirst({
      where: eq(collaborationChanges.sessionId, parsedSessionId),
      orderBy: [desc(collaborationChanges.appliedAt)]
    });
    
    // Get comments
    const comments = await db.query.collaborationComments.findMany({
      where: eq(collaborationComments.sessionId, parsedSessionId),
      orderBy: [desc(collaborationComments.createdAt)]
    });
    
    return res.json({
      status: 'success',
      data: {
        session,
        participants,
        latestChange,
        comments
      }
    });
  } catch (error) {
    console.error('Error fetching collaboration session:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch collaboration session'
    });
  }
});

export default router;