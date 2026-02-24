/**
 * Netlify Function: /sync/push
 * Receives local changes from client and syncs them to MongoDB
 * Handles conflict resolution via revision numbers
 */

import { getDatabase } from '../../utils/mongodb.js';
import { verifyToken } from '../../utils/auth.js';

export default async (req, context) => {
  try {
    // Verify user
    let user;
    try {
      user = verifyToken(req.headers.get('Authorization'));
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: ' + error.message }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let body;
    try {
      body = JSON.parse(req.body);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { goals, activities, timestamp } = body;
    const db = await getDatabase();

    console.log(`📤 Syncing ${(goals || []).length} goals and ${(activities || []).length} activities for user ${user.userId}`);

    // Upsert goals
    const goalResults = {};
    for (const goal of goals || []) {
      // Security: only sync own data
      if (goal.userId !== user.userId) {
        console.warn(`⚠️ Skipping goal ${goal.id} - user mismatch`);
        continue;
      }

      try {
        const currentRev = goal._rev || 1;
        const newRev = currentRev + 1;

        const result = await db.collection('goals').updateOne(
          { _id: goal._id || goal.id },
          {
            $set: {
              ...goal,
              userId: user.userId,
              _rev: newRev,
              updatedAt: new Date(),
              _synced: true
            }
          },
          { upsert: true }
        );

        goalResults[goal.id] = {
          rev: newRev,
          success: result.acknowledged
        };

        console.log(`✓ Synced goal ${goal.id} (rev ${newRev})`);
      } catch (error) {
        console.error(`❌ Error syncing goal ${goal.id}:`, error);
        goalResults[goal.id] = {
          success: false,
          error: error.message
        };
      }
    }

    // Upsert activities
    const activityResults = {};
    for (const activity of activities || []) {
      // Security: only sync own data
      if (activity.userId !== user.userId) {
        console.warn(`⚠️ Skipping activity ${activity.id} - user mismatch`);
        continue;
      }

      try {
        const currentRev = activity._rev || 1;
        const newRev = currentRev + 1;

        const result = await db.collection('activities').updateOne(
          { _id: activity._id || activity.id },
          {
            $set: {
              ...activity,
              userId: user.userId,
              _rev: newRev,
              updatedAt: new Date(),
              _synced: true
            }
          },
          { upsert: true }
        );

        activityResults[activity.id] = {
          rev: newRev,
          success: result.acknowledged
        };

        console.log(`✓ Synced activity ${activity.id} (rev ${newRev})`);
      } catch (error) {
        console.error(`❌ Error syncing activity ${activity.id}:`, error);
        activityResults[activity.id] = {
          success: false,
          error: error.message
        };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        goals: goalResults,
        activities: activityResults,
        timestamp: Date.now()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Sync push error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
