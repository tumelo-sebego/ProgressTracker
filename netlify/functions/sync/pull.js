/**
 * Netlify Function: /sync/pull
 * Returns all records modified since timestamp
 * Allows client to get changes made on other devices
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
    
    // Get 'since' parameter for timestamp-based filtering
    const url = new URL(req.url);
    const since = parseInt(url.searchParams.get('since') || '0');
    const sinceDate = new Date(since);
    
    console.log(`📥 Pulling changes for user ${user.userId} since ${sinceDate.toISOString()}`);
    
    const db = await getDatabase();

    // Query goals modified since timestamp
    const goals = await db.collection('goals')
      .find({
        userId: user.userId,
        updatedAt: { $gt: sinceDate }
      })
      .toArray();

    // Query activities modified since timestamp
    const activities = await db.collection('activities')
      .find({
        userId: user.userId,
        updatedAt: { $gt: sinceDate }
      })
      .toArray();

    console.log(`✓ Found ${goals.length} modified goals and ${activities.length} modified activities`);

    return new Response(
      JSON.stringify({
        goals: goals.map(g => ({
          ...g,
          _id: g._id.toString(),
          _rev: g._rev || 1
        })),
        activities: activities.map(a => ({
          ...a,
          _id: a._id.toString(),
          _rev: a._rev || 1
        })),
        timestamp: Date.now()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Sync pull error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
