# Dexie.js + MongoDB Sync Implementation Plan

## Overview
Keep the existing Dexie.js setup as the local database layer, add a lightweight sync engine via Netlify Functions to sync with MongoDB Atlas. This approach minimizes refactoring while adding cloud sync capabilities.

---

## Architecture

```
┌──────────────────────────────────┐
│    Vue App (Frontend)            │
├──────────────────────────────────┤
│  Existing Dexie.js               │
│  - users, goals, activities      │
└────────────┬─────────────────────┘
             │ (axios/fetch)
             │ Sync on changes + periodic
             │
┌────────────▼─────────────────────┐
│  Netlify Functions               │
│  ├── sync/pull                   │
│  ├── sync/push                   │
│  ├── auth/verify                 │
│  └── users/create                │
└────────────┬─────────────────────┘
             │ (MongoDB Driver)
             │
┌────────────▼─────────────────────┐
│  MongoDB Atlas                   │
│  Database: progress_tracker_db   │
│  ├── users                       │
│  ├── goals                       │
│  └── activities                  │
└──────────────────────────────────┘
```

---

## Phase 1: Setup & Dependencies

### 1.1 Update package.json
Add these dependencies:
```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "uuid": "^9.0.0"
  }
}
```

No need to remove Dexie - keep it as is!

### 1.2 Environment Setup
Create `.env.example`:
```
VITE_API_URL=http://localhost:8888/.netlify/functions
VITE_JWT_SECRET=your-secret-key-here
```

Create `.env.local` (git-ignored):
```
VITE_API_URL=https://yoursite.netlify.app/.netlify/functions
VITE_JWT_SECRET=your-secret-key-here

# Backend only
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/progress_tracker_db
JWT_SECRET=your-secret-key-here
```

---

## Phase 2: Dexie Schema Enhancement

### 2.1 Update schema.js to track sync metadata
```javascript
// src/db/schema.js
import Dexie from 'dexie';

export const db = new Dexie('ProgressTrackerDB');

db.version(6).stores({
  users: '++id, &email, password, name',
  goals: '++id, userId, status, [userId+status], _synced',
  activities: '++id, userId, goalId, date, [userId+goalId+date], [userId+status], _synced'
});

// Add sync tracking methods to each table
db.users.mapToClass(User);
db.goals.mapToClass(Goal);
db.activities.mapToClass(Activity);

class User {
  constructor(data) {
    Object.assign(this, data);
    this._id = this._id || this.id;
    this._synced = false;
    this._syncedAt = null;
  }
}

class Goal {
  constructor(data) {
    Object.assign(this, data);
    this._id = this._id || this.id;
    this._synced = false;
    this._syncedAt = null;
    this._rev = this._rev || 1;
  }
}

class Activity {
  constructor(data) {
    Object.assign(this, data);
    this._id = this._id || this.id;
    this._synced = false;
    this._syncedAt = null;
    this._rev = this._rev || 1;
  }
}
```

---

## Phase 3: Create HTTP Client

### 3.1 Create API client utility
```javascript
// src/api/client.js

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000
});

// Add JWT to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // Could redirect to login here
    }
    return Promise.reject(error);
  }
);

export default client;
```

---

## Phase 4: Implement Sync Engine

### 4.1 Create sync manager
```javascript
// src/db/syncManager.js

import client from '../api/client';
import { db } from './schema';

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = localStorage.getItem('lastSyncTime') || 0;
    this.syncInterval = 60000; // 60 seconds
  }

  async startAutoSync() {
    setInterval(() => {
      this.performFullSync();
    }, this.syncInterval);
  }

  async performFullSync() {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    try {
      console.log('Starting sync cycle...');
      
      // Step 1: Push local changes to server
      await this.pushLocalChanges();
      
      // Step 2: Pull server changes
      await this.pullRemoteChanges();
      
      this.lastSyncTime = Date.now();
      localStorage.setItem('lastSyncTime', this.lastSyncTime);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  async pushLocalChanges() {
    try {
      // Get all unsynced records
      const unsyncedGoals = await db.goals.where('_synced').equals(false).toArray();
      const unsyncedActivities = await db.activities.where('_synced').equals(false).toArray();
      
      if (unsyncedGoals.length === 0 && unsyncedActivities.length === 0) {
        console.log('No changes to push');
        return;
      }

      const payload = {
        goals: unsyncedGoals,
        activities: unsyncedActivities,
        timestamp: Date.now()
      };

      const response = await client.post('/sync/push', payload);

      // Mark records as synced
      for (const goal of unsyncedGoals) {
        await db.goals.update(goal.id, {
          _synced: true,
          _syncedAt: Date.now(),
          _rev: response.data.goals[goal.id]?.rev || goal._rev
        });
      }

      for (const activity of unsyncedActivities) {
        await db.activities.update(activity.id, {
          _synced: true,
          _syncedAt: Date.now(),
          _rev: response.data.activities[activity.id]?.rev || activity._rev
        });
      }

      console.log('Local changes pushed');
    } catch (error) {
      console.error('Push failed:', error);
      throw error;
    }
  }

  async pullRemoteChanges() {
    try {
      const response = await client.get('/sync/pull', {
        params: { since: this.lastSyncTime }
      });

      const { goals, activities } = response.data;

      // Upsert goals
      for (const goal of goals) {
        const local = await db.goals.get(goal._id);
        
        if (!local || local._rev < goal._rev) {
          // Remote is newer, use it
          await db.goals.put({ ...goal, id: goal._id, _synced: true });
        }
        // else: local is newer, keep local
      }

      // Upsert activities
      for (const activity of activities) {
        const local = await db.activities.get(activity._id);
        
        if (!local || local._rev < activity._rev) {
          await db.activities.put({ ...activity, id: activity._id, _synced: true });
        }
      }

      console.log('Remote changes pulled');
    } catch (error) {
      console.error('Pull failed:', error);
      throw error;
    }
  }

  // Trigger sync immediately
  async syncNow() {
    await this.performFullSync();
  }

  // Get sync status
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      syncInterval: this.syncInterval
    };
  }
}

export default new SyncManager();
```

### 4.2 Mark changes for sync
Update stores to mark records as unsynced when modified:

```javascript
// In authStore.js, activityStore.js, etc.
// After db.goals.add() or db.activities.update():

await db.goals.update(goalId, { _synced: false });
```

---

## Phase 5: Netlify Functions

### 5.1 Project Structure
```
netlify/
├── functions/
│   ├── sync/
│   │   ├── push.js
│   │   └── pull.js
│   └── auth/
│       └── verify.js
└── utils/
    ├── mongodb.js
    ├── auth.js
    └── errors.js
```

### 5.2 Create MongoDB Connection Handler
```javascript
// netlify/utils/mongodb.js

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
let cachedClient = null;

export async function getMongoClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  
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
  }
}
```

### 5.3 Create Auth Utility
```javascript
// netlify/utils/auth.js

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function verifyToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid token');
  }

  const token = authHeader.slice(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
```

### 5.4 Create Sync Push Function
```javascript
// netlify/functions/sync/push.js

import { getDatabase } from '../../utils/mongodb.js';
import { verifyToken } from '../../utils/auth.js';

export default async (req, context) => {
  try {
    // Verify user
    const user = verifyToken(req.headers.get('Authorization'));
    
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405 
      });
    }

    const body = JSON.parse(req.body);
    const { goals, activities, timestamp } = body;
    const db = await getDatabase();

    // Upsert goals
    const goalResults = {};
    for (const goal of goals || []) {
      if (goal.userId !== user.userId) {
        continue; // Security: only sync own data
      }

      const result = await db.collection('goals').updateOne(
        { _id: goal._id || goal.id },
        {
          $set: {
            ...goal,
            userId: user.userId,
            _rev: (goal._rev || 0) + 1,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );

      goalResults[goal.id] = {
        rev: (goal._rev || 0) + 1,
        success: result.acknowledged
      };
    }

    // Upsert activities
    const activityResults = {};
    for (const activity of activities || []) {
      if (activity.userId !== user.userId) {
        continue; // Security check
      }

      const result = await db.collection('activities').updateOne(
        { _id: activity._id || activity.id },
        {
          $set: {
            ...activity,
            userId: user.userId,
            _rev: (activity._rev || 0) + 1,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );

      activityResults[activity.id] = {
        rev: (activity._rev || 0) + 1,
        success: result.acknowledged
      };
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
    console.error('Sync push error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### 5.5 Create Sync Pull Function
```javascript
// netlify/functions/sync/pull.js

import { getDatabase } from '../../utils/mongodb.js';
import { verifyToken } from '../../utils/auth.js';

export default async (req, context) => {
  try {
    const user = verifyToken(req.headers.get('Authorization'));
    
    const since = parseInt(new URL(req.url).searchParams.get('since') || '0');
    const db = await getDatabase();

    // Query goals modified since timestamp
    const goals = await db.collection('goals')
      .find({
        userId: user.userId,
        updatedAt: { $gt: new Date(since) }
      })
      .toArray();

    // Query activities modified since timestamp
    const activities = await db.collection('activities')
      .find({
        userId: user.userId,
        updatedAt: { $gt: new Date(since) }
      })
      .toArray();

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
    console.error('Sync pull error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### 5.6 Create Auth Endpoint
```javascript
// netlify/functions/auth/verify.js

import { getDatabase } from '../../utils/mongodb.js';
import { generateToken, verifyToken } from '../../utils/auth.js';

export default async (req, context) => {
  try {
    if (req.method === 'POST') {
      // Login endpoint
      const body = JSON.parse(req.body);
      const { email, password } = body;
      const db = await getDatabase();

      const user = await db.collection('users').findOne({ email });
      
      if (!user || user.password !== password) {
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const token = generateToken(user._id.toString(), user.email);
      
      return new Response(
        JSON.stringify({
          success: true,
          token,
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else if (req.method === 'GET') {
      // Verify existing token
      const user = verifyToken(req.headers.get('Authorization'));
      return new Response(
        JSON.stringify({ success: true, user }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

---

## Phase 6: Update Auth Store

### 6.1 Update authStore.js to use JWT
```javascript
// src/stores/authStore.js
// Key changes:

async function login(email, password) {
  try {
    const response = await client.post('/auth/verify', { email, password });
    const { token, user } = response.data;
    
    // Store JWT
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    user.value = user;
    return true;
  } catch (error) {
    console.error('Login failed', error);
    return false;
  }
}

async function signup(name, email, password) {
  try {
    const userId = await db.users.add({ name, email, password });
    // Try to sync with backend
    await syncManager.syncNow();
    return true;
  } catch (error) {
    console.error('Signup failed', error);
    return false;
  }
}

function logout() {
  user.value = null;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}
```

---

## Phase 7: Initialize Sync on App Startup

### 7.1 Update main.js
```javascript
// src/main.js

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import syncManager from './db/syncManager'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Initialize sync when app starts
if (localStorage.getItem('auth_token')) {
  syncManager.startAutoSync();
  // Perform initial sync
  syncManager.syncNow();
}

app.mount('#app')
```

---

## Phase 8: MongoDB Atlas Setup

### 8.1 Create Database & Collections
1. Login to MongoDB Atlas
2. Create cluster: `progress-tracker`
3. Create database: `progress_tracker_db`
4. Create collections:
   - `users` (add text index on email)
   - `goals` (add index on userId)
   - `activities` (add index on userId, goalId)

### 8.2 Create Indexes
```javascript
// MongoDB Atlas - Indexes tab

// users collection
db.users.createIndex({ email: 1 }, { unique: true })

// goals collection
db.goals.createIndex({ userId: 1 })
db.goals.createIndex({ userId: 1, status: 1 })

// activities collection
db.activities.createIndex({ userId: 1 })
db.activities.createIndex({ goalId: 1 })
db.activities.createIndex({ userId: 1, goalId: 1 })
```

### 8.3 Set Security
- Create database user for Netlify
- Add Netlify IP to whitelist (0.0.0.0/0 for testing, restrict in production)
- Enable encryption at rest

---

## Phase 9: Netlify Deployment & Configuration

### 9.1 Create netlify.toml
```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = "dist"

[env.production]
  [env.production.environment]
    VITE_API_URL = "https://yoursite.netlify.app/.netlify/functions"
    MONGODB_URI = "mongodb+srv://username:password@cluster.mongodb.net/progress_tracker_db"
    JWT_SECRET = "your-secure-jwt-secret"

[env.development]
  [env.development.environment]
    VITE_API_URL = "http://localhost:8888/.netlify/functions"
```

### 9.2 Deploy Steps
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Test locally
netlify dev

# Deploy to production
netlify deploy --prod

# Or just push to Git (auto-deploys if connected)
git push origin main
```

---

## Phase 10: Conflict Resolution Strategy

### 10.1 Last-Write-Wins (Simple)
Keep revision numbers, use `_rev` field:
- Remote _rev > local _rev → use remote
- Local _rev >= remote _rev → keep local

### 10.2 Custom Logic (Advanced)
```javascript
// For same document modified locally and remotely:
// 1. Check which one has newer timestamp
// 2. For specific fields, merge intelligently (e.g., addition vs modification)
// 3. Fall back to user confirmation UI if needed
```

---

## Implementation Checklist

### Backend
- [ ] Create Netlify functions folder structure
- [ ] Implement sync/push.js
- [ ] Implement sync/pull.js
- [ ] Implement auth/verify.js
- [ ] Create MongoDB utilities
- [ ] Create JWT utilities
- [ ] Test functions locally with Netlify CLI

### Frontend
- [ ] Add axios to package.json
- [ ] Create api/client.js
- [ ] Create sync/syncManager.js
- [ ] Update db/schema.js with sync fields
- [ ] Update authStore.js for JWT
- [ ] Update activityStore.js to mark _synced = false
- [ ] Update main.js to init sync
- [ ] Test locally

### MongoDB Atlas
- [ ] Create cluster & database
- [ ] Set up collections & indexes
- [ ] Create database user
- [ ] Add IP whitelist

### Deployment
- [ ] Create netlify.toml
- [ ] Set environment variables on Netlify
- [ ] Deploy functions
- [ ] Test production sync
- [ ] Monitor MongoDB & function execution

---

## Key Benefits of This Approach

✅ **Minimal Refactoring** - Keeps existing Dexie setup intact
✅ **Offline-First** - Works without internet, syncs when available
✅ **Simple Sync** - Push-pull model is straightforward
✅ **Cost-Effective** - Netlify Functions + MongoDB free tier options
✅ **Scalable** - Easy to add more tables later
✅ **Transparent** - Existing app logic works unchanged

---

## Potential Issues & Solutions

| Issue | Solution |
|-------|----------|
| Large dataset sync | Implement pagination, batch sync |
| Conflicts | Use _rev + last-write-wins strategy |
| Offline sync queue | Store failed syncs, retry on reconnect |
| JWT expiry | Refresh token on 401 response |
| Password storage | Use bcrypt on backend (never plain text) |

---

## Testing Strategy

1. **Local Testing**: `netlify dev` simulates production
2. **Sync Testing**: Modify data, check MongoDB reflects changes
3. **Offline Testing**: Disable internet, make changes, verify queue
4. **Multi-device**: Login on different devices, sync simultaneously
5. **Conflict Testing**: Modify same record on two devices, verify resolution

---

## Resources
- Dexie Docs: https://dexie.org/
- Netlify Functions: https://docs.netlify.com/functions
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas/register
- JWT: https://jwt.io/
