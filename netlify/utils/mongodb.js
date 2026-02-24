/**
 * MongoDB connection utilities for Netlify Functions
 * Handles connection caching to reuse connections across function invocations
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
let cachedClient = null;

export async function getMongoClient() {
  if (cachedClient && cachedClient.topology && cachedClient.topology.isConnected()) {
    console.log('✓ Reusing existing MongoDB connection');
    return cachedClient;
  }

  console.log('🔗 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  await client.connect();
  cachedClient = client;
  console.log('✓ Connected to MongoDB');
  
  return client;
}

export async function getDatabase() {
  const client = await getMongoClient();
  return client.db('progress_tracker_db');
}

export async function closeConnection() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    console.log('🔌 MongoDB connection closed');
  }
}
