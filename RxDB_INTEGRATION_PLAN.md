# RxDB Sync Engine Integration Plan

## Overview
Migrate from Dexie (IndexedDB only) to RxDB with MongoDB Atlas backend via Netlify Functions, enabling real-time sync across devices.

---

## Phase 1: Project Setup & Dependencies

### 1.1 Add NPM Dependencies
```json
// package.json - Add to dependencies
{
  "rxdb": "^14.x.x",
  "rxjs": "^7.x.x",
  "mongodb": "^6.x.x",        // For Netlify Functions
  "axios": "^1.x.x",          // For HTTP calls to Netlify Functions
  "dotenv": "^16.x.x"
}
```

### 1.2 Create Environment Files
```
.env.local (gitignored)
.env.example
netlify.toml (updated)
```

---

## Phase 2: Backend Setup (Netlify Functions)

### 2.1 Create Netlify Functions Structure
```
netlify/
├── functions/
│   ├── sync-pull.js          # Pull changes from MongoDB
│   ├── sync-push.js          # Push changes to MongoDB
│   ├── auth-verify.js        # Verify JWT tokens
│   └── db-init.js            # Initialize MongoDB collections
└── utils/
    ├── mongodb.js             # MongoDB connection & operations
    ├── auth.js               # Token verification
    └── sync-helpers.js       # Replication logic
```

### 2.2 MongoDB Atlas Setup
- Create cluster and database: `progress_tracker_db`
- Collections needed:
  - `users`
  - `goals`
  - `activities`
- Add connection string to `.env.local`

### 2.3 Key Netlify Functions

#### sync-pull.js
```javascript
// Endpoint: /.netlify/functions/sync-pull
// Purpose: Send MongoDB changes to client
// Input: userId, lastPullTimestamp
// Output: Changed documents since timestamp
```

#### sync-push.js
```javascript
// Endpoint: /.netlify/functions/sync-push
// Purpose: Receive client changes and write to MongoDB
// Input: userId, documents array, revisions
// Output: Conflict resolution results, new revisions
```

#### auth-verify.js
```javascript
// Verify JWT token from localStorage
// Authenticate all sync requests
```

---

## Phase 3: Frontend RxDB Setup

### 3.1 Create RxDB Schema Definitions
```
src/db/
├── schemas/
│   ├── user.schema.js
│   ├── goal.schema.js
│   └── activity.schema.js
├── database.js              # RxDB instance & collection setup
└── sync-config.js           # Replication configuration
```

### 3.2 RxDB Schema Example Structure
```javascript
// Each schema needs:
// - version
// - type definitions
// - properties with validation
// - indexes
// - attachments (if applicable)
```

### 3.3 Database Initialization
```javascript
// src/db/database.js
// Creates RxDB instance
// Initializes collections with schemas
// Sets up sync with configurable options
```

---

## Phase 4: Store Updates

### 4.1 Update authStore.js
- Replace direct `db.users` calls with RxDB queries
- Add JWT token generation & storage
- Update login/signup to sync with backend

### 4.2 Update activityStore.js
- Replace `db.activities` with RxDB live queries
- Update sync subscriptions for RxDB
- Modify activity start/finish to use RxDB upsert

### 4.3 Create new syncStore.js (optional)
```javascript
// Handle sync state management
// Track: sync status, conflicts, last sync time
// Methods: triggerSync(), resolveConflict(), getSyncStatus()
```

---

## Phase 5: Sync Configuration

### 5.1 RxDB Replication Strategy
```javascript
// src/db/sync-config.js

// Pull Replication
// - Fetches changes from /.netlify/functions/sync-pull
// - Frequency: Every 30-60 seconds OR on-demand
// - Handles conflicts with strategy: 'last-write-wins' or custom

// Push Replication
// - Sends local changes to /.netlify/functions/sync-push
// - Automatic on local changes
// - Retry logic for failed pushes
```

### 5.2 Conflict Resolution Strategy
Options:
1. **Last-Write-Wins**: Use `updatedAt` timestamp
2. **Custom Logic**: Merge certain fields, take newer for others
3. **Manual**: Show UI prompt for user to choose

---

## Phase 6: Data Migration

### 6.1 Migrate Existing Data
```javascript
// Migration script to:
// 1. Read all data from Dexie (old IndexedDB)
// 2. Transform to RxDB format
// 3. Write to RxDB local database
// 4. Sync to MongoDB via Netlify Functions
```

### 6.2 Handle Backward Compatibility
- Detect if user has Dexie data
- Run migration on first login
- Clean up old Dexie data

---

## Phase 7: Authentication & Security

### 7.1 JWT Implementation
```javascript
// Netlify Functions:
// 1. Generate JWT on login/signup
// 2. Include userId and expiry

// Frontend:
// 1. Store JWT in localStorage
// 2. Include in all sync requests
// 3. Refresh token on expiry
```

### 7.2 MongoDB Security
- Enable authentication
- Use IP whitelist (add Netlify IPs)
- Encrypt sensitive fields (passwords)

---

## Phase 8: Testing & Deployment

### 8.1 Local Testing
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Test functions locally
netlify functions:serve

# Test with dev server
npm run dev
```

### 8.2 Deployment Checklist
- [ ] Deploy Netlify Functions
- [ ] Update `.env.local` with production URLs
- [ ] Test sync on production
- [ ] Monitor MongoDB Atlas metrics
- [ ] Set up error logging (e.g., Sentry)

---

## File-by-File Changes Summary

### New Files to Create
1. `netlify/functions/sync-pull.js`
2. `netlify/functions/sync-push.js`
3. `netlify/functions/auth-verify.js`
4. `netlify/utils/mongodb.js`
5. `netlify/utils/auth.js`
6. `netlify/utils/sync-helpers.js`
7. `src/db/database.js` (replaces current structure)
8. `src/db/schemas/user.schema.js`
9. `src/db/schemas/goal.schema.js`
10. `src/db/schemas/activity.schema.js`
11. `src/db/sync-config.js`
12. `src/stores/syncStore.js` (optional)
13. `.env.example`
14. `netlify.toml`

### Files to Modify
1. `package.json` - Add RxDB dependencies
2. `src/stores/authStore.js` - Update to use RxDB + JWT
3. `src/stores/activityStore.js` - Update to use RxDB collections
4. `src/main.js` - Initialize RxDB on app startup
5. `src/views/LoginView.vue` - Add JWT-based auth
6. `src/views/SignupView.vue` - Update for new auth flow

### Files to Remove
1. `src/db/schema.js` (replaced by RxDB schemas)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│              Vue App (Frontend)                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  Components / Views                           │  │
│  └──────────────────┬──────────────────────────┘  │
│                     │                             │
│  ┌──────────────────▼──────────────────────────┐  │
│  │  Pinia Stores (auth, activity, sync)        │  │
│  └──────────────────┬──────────────────────────┘  │
│                     │                             │
│  ┌──────────────────▼──────────────────────────┐  │
│  │  RxDB Instance (Collections)                │  │
│  │  - users, goals, activities                 │  │
│  └──────────────────┬──────────────────────────┘  │
│                     │                             │
└─────────────────────┼──────────────────────────────┘
                      │
                      │ (HTTP Requests)
                      │ axios to .netlify/functions/
                      │
┌─────────────────────▼──────────────────────────────┐
│        Netlify Functions (Backend)                 │
│  ┌───────────────────────────────────────────────┐ │
│  │  /sync-pull, /sync-push, /auth-verify       │ │
│  └───────────────────────────────────────────────┘ │
│                     │                             │
└─────────────────────┼──────────────────────────────┘
                      │
                      │ (MongoDB Driver)
                      │
┌─────────────────────▼──────────────────────────────┐
│      MongoDB Atlas (Cloud Database)               │
│  Database: progress_tracker_db                   │
│  Collections: users, goals, activities           │
└─────────────────────────────────────────────────────┘
```

---

## Key Considerations

### Performance
- Batch sync operations to reduce function calls
- Implement pagination for large datasets
- Cache sync state to avoid redundant requests

### Offline-First
- RxDB stores data locally
- Sync happens when connection returns
- No data loss if offline temporarily

### Scalability
- Netlify Functions scale automatically
- MongoDB Atlas handles connections
- Consider read/write limits in MongoDB tier

### Security
- Always verify JWT tokens in functions
- Never expose MongoDB connection string to client
- Use Netlify environment variables for secrets
- Hash passwords before storing

---

## Implementation Order (Recommended)

1. **Week 1**: Backend setup (Netlify + MongoDB)
2. **Week 2**: RxDB schema design & database setup
3. **Week 3**: Implement sync functions (pull/push)
4. **Week 4**: Update stores to use RxDB
5. **Week 5**: Add JWT authentication
6. **Week 6**: Data migration & testing
7. **Week 7**: Production deployment & monitoring

---

## Resources
- RxDB Docs: https://rxdb.info/
- Netlify Functions: https://www.netlify.com/products/functions/
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- JWT Auth: https://jwt.io/

