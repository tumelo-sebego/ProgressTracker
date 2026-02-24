/**
 * Netlify Function: /auth/verify
 * Handles login and token generation
 * POST: Login with email/password
 * GET: Verify existing token
 */

import { getDatabase } from '../../utils/mongodb.js';
import { generateToken, verifyToken } from '../../utils/auth.js';

export default async (req, context) => {
  try {
    if (req.method === 'POST') {
      // Login endpoint
      let body;
      try {
        body = JSON.parse(req.body);
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Invalid request body' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { email, password } = body;

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email and password required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const db = await getDatabase();

      // For now, check local Dexie data (no MongoDB users yet)
      // In production, you would check MongoDB users collection
      console.log(`🔐 Login attempt: ${email}`);

      // NOTE: In a full implementation, you would:
      // 1. Query MongoDB for user
      // 2. Compare password (with bcrypt)
      // 3. Generate JWT token

      // For MVP, we'll just return an error until MongoDB is set up
      return new Response(
        JSON.stringify({ 
          error: 'Backend authentication not yet configured. Using local authentication for now.' 
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );

    } else if (req.method === 'GET') {
      // Verify existing token
      try {
        const user = verifyToken(req.headers.get('Authorization'));
        return new Response(
          JSON.stringify({ success: true, user }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('❌ Auth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
