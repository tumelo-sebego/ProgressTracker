/**
 * JWT authentication utilities for Netlify Functions
 * Handles token generation and verification
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET not set in environment variables');
}

export function verifyToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.slice(7);
  
  try {
    // Check if it's a mock local token (base64 encoded "userId:email")
    try {
      const decoded = atob(token);
      if (decoded.includes(':')) {
        const [userIdStr, email] = decoded.split(':');
        const userId = parseInt(userIdStr, 10);
        if (!isNaN(userId) && email) {
          console.log('✓ Using local mock token for userId:', userId);
          return { userId, email };
        }
      }
    } catch (e) {
      // Not a mock token, try JWT verification
    }

    // Try JWT verification
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET not configured and not a mock token');
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✓ JWT token verified for userId:', decoded.userId);
    return decoded;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

export function generateToken(userId, email) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
