# Data Migration & Backward-Compatible Sync Plan

## Current State Analysis

### Existing Schema (v5)
```javascript
db.version(5).stores({
  users: '++id, &email, password, name',
  goals: '++id, userId, status, [userId+status]',
  activities: '++id, userId, goalId, date, [userId+goalId+date], [userId+status]'
});
```

### Data Currently in IndexedDB (No Sync Metadata)
- **users**: `{ id, email, password, name }` ← Missing: `_synced`, `_syncedAt`, `_rev`, `_id`
- **goals**: `{ id, userId, title, duration, status, ... }` ← Missing: `_synced`, `_syncedAt`, `_rev`, `_id`
- **activities**: `{ id, userId, goalId, date, status, duration, ... }` ← Missing: `_synced`, `_syncedAt`, `_rev`, `_id`

**Problem**: Users have existing data that doesn't have the new sync metadata fields, so adding sync logic directly will fail.

---

## Phase 0: Backward-Compatible Schema Migration

### 0.1 Step-by-Step Schema Update (Version 6)
```javascript
// src/db/schema.js
import Dexie from 'dexie';

export const db = new Dexie('ProgressTrackerDB');

// IMPORTANT: Increment version number (5 → 6)
// This triggers Dexie's migration hooks
db.version(6).stores({
  // Add _synced to indexes (optional, for querying unsynced records)
  users: '++id, &email, password, name',
  goals: '++id, userId, status, [userId+status], _synced',
  activities: '++id, userId, goalId, date, [userId+goalId+date], [userId+status], _synced'
});

// CRITICAL: Use hooks to safely migrate existing data
db.version(6).on('populate', (db) => {
  console.log('Database v6: Initial creation, no migration needed');
});

db.version(5).on('upgrade', async (tx) => {
  console.log('Upgrading from v5 to v6...');
  
  // Migrate users
  await tx.table('users').toCollection().modify((user) => {
    // Only add fields if they don't exist
    if (!user._synced) user._synced = true;        // Existing data is "synced"
    if (!user._syncedAt) user._syncedAt = Date.now();
    if (!user._rev) user._rev = 1;
    if (!user._id) user._id = user.id;             // Use existing ID
    
    console.log(`✓ Migrated user: ${user.email}`);
  });
  
  // Migrate goals
  await tx.table('goals').toCollection().modify((goal) => {
    if (!goal._synced) goal._synced = true;        // Existing data is "synced"
    if (!goal._syncedAt) goal._syncedAt = Date.now();
    if (!goal._rev) goal._rev = 1;
    if (!goal._id) goal._id = goal.id;
    
    console.log(`✓ Migrated goal: ${goal.title}`);
  });
  
  // Migrate activities
  await tx.table('activities').toCollection().modify((activity) => {
    if (!activity._synced) activity._synced = true;  // Existing data is "synced"
    if (!activity._syncedAt) activity._syncedAt = Date.now();
    if (!activity._rev) activity._rev = 1;
    if (!activity._id) activity._id = activity.id;
    
    console.log(`✓ Migrated activity: ${activity.title}`);
  });
  
  console.log('Migration complete! All existing data now has sync metadata.');
});
```

### 0.2 How This Works

**Key Concept**: Mark all existing data as `_synced: true`
- Existing data → Already "persisted" locally
- No need to re-sync what user already has
- New changes (after migration) → Get marked `_synced: false`

**Migration Flow**:
```
User opens app with v5 data
  ↓
Dexie detects version 5 → upgrading to 6
  ↓
Runs db.version(5).on('upgrade', ...) hook
  ↓
For each record: adds _synced, _syncedAt, _rev, _id fields
  ↓
All existing data marked _synced: true
  ↓
App continues normally - no data loss!
```

**Console Output (User Will See)**:
```
Upgrading from v5 to v6...
✓ Migrated user: user@example.com
✓ Migrated goal: Learn Spanish
✓ Migrated activity: Practice vocab
✓ Migrated activity: Speak with tutor
Migration complete! All existing data now has sync metadata.
```

---

## Phase 1: Safe Sync Manager (Handles Missing Metadata)

### 1.1 Defensive Sync Manager
```javascript
// src/db/syncManager.js

import client from '../api/client';
import { db } from './schema';

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = localStorage.getItem('lastSyncTime') || 0;
    this.syncInterval = 60000; // 60 seconds
    this.migrationRequired = false;
  }

  async checkAndMigrate() {
    console.log('Checking if migration needed...');
    
    // Check if any records are missing sync fields
    const usersWithoutMeta = await db.users
      .where('_synced')
      .notEqual(true)
      .toArray();
    
    const goalsWithoutMeta = await db.goals
      .where('_synced')
      .notEqual(true)
      .toArray();
    
    const activitiesWithoutMeta = await db.activities
      .where('_synced')
      .notEqual(true)
      .toArray();
    
    if (usersWithoutMeta.length > 0 || goalsWithoutMeta.length > 0 || activitiesWithoutMeta.length > 0) {
      console.warn('⚠️ Found records without sync metadata. Running manual migration...');
      await this.manualMigration();
    } else {
      console.log('✓ All records have sync metadata');
    }
  }

  async manualMigration() {
    try {
      // Migrate users
      const users = await db.users.toArray();
      for (const user of users) {
        if (!user._synced) {
          await db.users.update(user.id, {
            _synced: true,
            _syncedAt: Date.now(),
            _rev: user._rev || 1,
            _id: user._id || user.id
          });
          console.log(`✓ Manually migrated user: ${user.email}`);
        }
      }

      // Migrate goals
      const goals = await db.goals.toArray();
      for (const goal of goals) {
        if (!goal._synced) {
          await db.goals.update(goal.id, {
            _synced: true,
            _syncedAt: Date.now(),
            _rev: goal._rev || 1,
            _id: goal._id || goal.id
          });
          console.log(`✓ Manually migrated goal: ${goal.title}`);
        }
      }

      // Migrate activities
      const activities = await db.activities.toArray();
      for (const activity of activities) {
        if (!activity._synced) {
          await db.activities.update(activity.id, {
            _synced: true,
            _syncedAt: Date.now(),
            _rev: activity._rev || 1,
            _id: activity._id || activity.id
          });
          console.log(`✓ Manually migrated activity: ${activity.id}`);
        }
      }

      console.log('✓ Manual migration complete');
    } catch (error) {
      console.error('Manual migration failed:', error);
    }
  }

  async startAutoSync() {
    // Check for migration on startup
    await this.checkAndMigrate();
    
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
      console.log('✓ Sync cycle complete');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  async pushLocalChanges() {
    try {
      // Safely handle records that might not have metadata
      const unsyncedGoals = await db.goals.where('_synced').equals(false).toArray();
      const unsyncedActivities = await db.activities.where('_synced').equals(false).toArray();
      
      if (unsyncedGoals.length === 0 && unsyncedActivities.length === 0) {
        console.log('No changes to push');
        return;
      }

      // Ensure all records have required metadata before sending
      const sanitizedGoals = unsyncedGoals.map(g => ({
        ...g,
        _id: g._id || g.id,
        _rev: g._rev || 1
      }));

      const sanitizedActivities = unsyncedActivities.map(a => ({
        ...a,
        _id: a._id || a.id,
        _rev: a._rev || 1
      }));

      const payload = {
        goals: sanitizedGoals,
        activities: sanitizedActivities,
        timestamp: Date.now()
      };

      const response = await client.post('/sync/push', payload);

      // Mark records as synced
      for (const goal of unsyncedGoals) {
        await db.goals.update(goal.id, {
          _synced: true,
          _syncedAt: Date.now(),
          _rev: response.data?.goals?.[goal.id]?.rev || (goal._rev || 1) + 1
        });
      }

      for (const activity of unsyncedActivities) {
        await db.activities.update(activity.id, {
          _synced: true,
          _syncedAt: Date.now(),
          _rev: response.data?.activities?.[activity.id]?.rev || (activity._rev || 1) + 1
        });
      }

      console.log(`✓ Pushed ${unsyncedGoals.length + unsyncedActivities.length} changes`);
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

      const { goals = [], activities = [] } = response.data;

      // Upsert goals with safety checks
      for (const goal of goals) {
        const local = await db.goals.get(goal._id || goal.id);
        
        if (!local || (local._rev || 1) < (goal._rev || 1)) {
          await db.goals.put({ 
            ...goal, 
            id: goal._id || goal.id, 
            _synced: true,
            _rev: goal._rev || 1,
            _id: goal._id || goal.id
          });
        }
      }

      // Upsert activities with safety checks
      for (const activity of activities) {
        const local = await db.activities.get(activity._id || activity.id);
        
        if (!local || (local._rev || 1) < (activity._rev || 1)) {
          await db.activities.put({ 
            ...activity, 
            id: activity._id || activity.id, 
            _synced: true,
            _rev: activity._rev || 1,
            _id: activity._id || activity.id
          });
        }
      }

      console.log(`✓ Pulled ${goals.length + activities.length} remote changes`);
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

---

## Phase 2: Update Activity Store (Mark New Changes)

### 2.1 Mark as Unsynced on Changes
```javascript
// src/stores/activityStore.js
// Add this after any db.activities.update() or db.activities.add() call:

import syncManager from '../db/syncManager';

async function finishActivity() {
  if (!currentActivity.value) return;
  const id = currentActivity.value.id;
  const now = Date.now();
  
  // ... existing finish logic ...
  
  await db.activities.update(id, {
    status: 'done',
    startTime: null,
    end_time: now,
    duration: durationVal,
    _synced: false  // ← Mark for resync
  });

  const updated = await db.activities.get(id);
  currentActivity.value = updated;
  
  // Trigger immediate sync if connected
  syncManager.syncNow().catch(err => {
    console.log('Background sync will retry in 60s', err);
  });
}

async function startActivity() {
  if (!currentActivity.value) return;
  const now = Date.now();
  const id = currentActivity.value.id;
  
  await db.activities.update(id, {
    status: 'active',
    startTime: now,
    start_time: now,
    _synced: false  // ← Mark for resync
  });
  
  const updated = await db.activities.get(id);
  currentActivity.value = updated;
  
  syncManager.syncNow().catch(err => {
    console.log('Background sync will retry in 60s', err);
  });
}
```

---

## Phase 3: Update Auth Store (Mark New Changes)

### 3.1 Mark New Data as Unsynced
```javascript
// src/stores/authStore.js

async function finishOnboarding() {
  if (!user.value) {
    alert("Development Mode: No user logged in. Progress will not be saved to the database.");
    return true;
  }
  try {
    // ... existing date calculation logic ...

    // Save Goal with sync metadata
    const goalId = await db.goals.add({
      userId: user.value.id,
      title: onboardingData.value.goal.title,
      duration: onboardingData.value.goal.duration,
      frequency: onboardingData.value.goal.frequency,
      weeklyDays: onboardingData.value.goal.weeklyDays,
      status: 'active',
      start_date: startDateStr,
      end_date: endDateStr,
      createdAt: new Date(),
      _synced: false,  // ← NEW DATA: mark as unsynced
      _syncedAt: null,
      _rev: 1,
      _id: null  // Will be assigned on first sync
    });

    // Save Activities with sync metadata
    const activitiesStartDate = startDateStr;
    const activitiesToSave = onboardingData.value.activities.map(act => ({
      userId: user.value.id,
      goalId: goalId,
      title: act.title,
      points: act.points,
      status: 'pending',
      date: activitiesStartDate,
      _synced: false,  // ← NEW DATA: mark as unsynced
      _syncedAt: null,
      _rev: 1,
      _id: null  // Will be assigned on first sync
    }));
    
    await db.activities.bulkAdd(activitiesToSave);

    // Reset Onboarding Data
    onboardingData.value = { goal: { title: '', duration: 1, frequency: '1 Day/Week', weeklyDays: 1, startPreference: 'Today', customStartDate: '' }, activities: [] };
    
    return true;
  } catch (error) {
    console.error("Failed to save onboarding data:", error);
    return false;
  }
}
```

---

## Phase 4: Initialize Sync Safely on App Startup

### 4.1 Update main.js with Safe Sync Init
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

// Initialize sync when app starts (with fallback error handling)
async function initializeSync() {
  try {
    if (localStorage.getItem('auth_token')) {
      console.log('🔄 Initializing sync engine...');
      
      // Check and migrate any old data
      await syncManager.checkAndMigrate();
      
      // Start auto-sync
      syncManager.startAutoSync();
      
      // Perform initial sync immediately
      await syncManager.syncNow();
      
      console.log('✓ Sync engine ready');
    }
  } catch (error) {
    console.error('Sync initialization failed (app will still work offline):', error);
    // App continues even if sync fails - offline-first design
  }
}

// Call sync initialization after mount
app.mount('#app')
initializeSync();
```

---

## Phase 5: Netlify Functions (Handle Missing Metadata)

### 5.1 Update sync/push.js - Defensive
```javascript
// netlify/functions/sync/push.js
// Add defensive checks for missing fields

import { getDatabase } from '../../utils/mongodb.js';
import { verifyToken } from '../../utils/auth.js';

export default async (req, context) => {
  try {
    const user = verifyToken(req.headers.get('Authorization'));
    
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405 
      });
    }

    const body = JSON.parse(req.body);
    const { goals, activities, timestamp } = body;
    const db = await getDatabase();

    // Upsert goals with metadata handling
    const goalResults = {};
    for (const goal of goals || []) {
      if (goal.userId !== user.userId) {
        continue; // Security check
      }

      // Safely handle version info
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
    }

    // Upsert activities with metadata handling
    const activityResults = {};
    for (const activity of activities || []) {
      if (activity.userId !== user.userId) {
        continue;
      }

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

---

## Data State Examples

### Example 1: User with Existing Activities
**Before Migration (v5)**:
```javascript
{
  id: 1,
  userId: 123,
  goalId: 5,
  title: "Morning Run",
  status: "done",
  duration: 30,
  date: "2026-02-20"
}
```

**After Migration (v6)**:
```javascript
{
  id: 1,
  userId: 123,
  goalId: 5,
  title: "Morning Run",
  status: "done",
  duration: 30,
  date: "2026-02-20",
  _synced: true,           // ← Existing data is "post-sync"
  _syncedAt: 1708873000,
  _rev: 1,                 // ← Start revision at 1
  _id: 1                   // ← Use existing ID
}
```

### Example 2: New Activity Created After Migration
```javascript
{
  id: 2,
  userId: 123,
  goalId: 5,
  title: "New Activity",
  status: "pending",
  date: "2026-02-24",
  _synced: false,          // ← NEW data: not synced yet
  _syncedAt: null,
  _rev: 1,
  _id: null
}
```

**After First Sync**:
```javascript
{
  id: 2,
  userId: 123,
  goalId: 5,
  title: "New Activity",
  status: "pending",
  date: "2026-02-24",
  _synced: true,           // ← Now synced
  _syncedAt: 1708873500,
  _rev: 2,                 // ← Incremented by server
  _id: "507f1f77bcf86cd799439011"  // ← MongoDB ObjectId
}
```

---

## Migration Flow Diagram

```
App v5 Starts
    ↓
User has existing data in IndexedDB
    ↓
Dexie detects version upgrade (5 → 6)
    ↓
db.version(5).on('upgrade') hook runs
    ↓
For each existing record:
  - Add: _synced: true
  - Add: _syncedAt: Date.now()
  - Add: _rev: 1
  - Add: _id: recordId
    ↓
App continues normally
    ↓
User makes a change (creates activity)
    ↓
New activity saved with _synced: false
    ↓
Auto-sync fires:
  - Pushes only unsynced records
  - MongoDB receives & increments _rev
  - Client marks as _synced: true
    ↓
Multi-device sync works seamlessly
```

---

## Implementation Checklist

### Phase 0: Schema Migration
- [ ] Update schema.js: version 5 → 6
- [ ] Add `_synced` index to schema
- [ ] Add `db.version(5).on('upgrade')` hook
- [ ] Test locally: open DevTools → Application → IndexedDB → check for migration logs
- [ ] Verify all records get payload fields

### Phase 1: Safe Sync Manager
- [ ] Create/update src/db/syncManager.js
- [ ] Add `checkAndMigrate()` method
- [ ] Add `manualMigration()` fallback
- [ ] Add safety checks in push/pull for missing metadata
- [ ] Handle null/undefined for _id, _rev

### Phase 2: Activity Store Updates
- [ ] Add `_synced: false` when creating activities
- [ ] Add `_synced: false` when updating activities
- [ ] Import syncManager for on-demand sync
- [ ] Add error handling for sync failures

### Phase 3: Auth Store Updates
- [ ] Add sync metadata to goals created in `finishOnboarding()`
- [ ] Add sync metadata to activities created in `finishOnboarding()`
- [ ] Mark new data as `_synced: false`

### Phase 4: App Startup
- [ ] Update main.js with `initializeSync()`
- [ ] Add migration check before auto-sync
- [ ] Add error handling (app works offline if sync fails)
- [ ] Test on fresh install & with existing data

### Phase 5: Netlify Functions
- [ ] Update sync/push.js with metadata handling
- [ ] Update sync/pull.js with defensive checks
- [ ] Handle edge cases: missing _rev, missing _id
- [ ] Log all sync operations

---

## Safety Features

✅ **No Data Loss**: Existing data preserved with new metadata
✅ **Fallback Migration**: Manual migration if auto-migration fails
✅ **Offline-First**: App works even if sync fails
✅ **Defensive Coding**: Handle missing fields gracefully
✅ **Console Logging**: User can see migration progress
✅ **Backward Compatible**: Old clients still work, new ones migrate automatically

---

## Testing Strategy

### Test 1: Fresh Installation (No Existing Data)
1. Clear IndexedDB manually
2. Start app
3. Create new user
4. Create goal & activities
5. Verify: `_synced: false` on creation
6. Wait for auto-sync
7. Verify: `_synced: true` after sync

### Test 2: Upgrade Existing Data (Current State)
1. Start fresh with v5 (old schema)
2. Create user, goals, activities
3. Verify: no sync metadata
4. Upgrade to v6
5. Open DevTools Console
6. Verify migration logs appear
7. Check IndexedDB: records now have `_synced: true`

### Test 3: Mixed Data (Old + New)
1. Start with migrated data
2. Create new activity
3. Verify new activity has `_synced: false`
4. Wait for sync
5. Verify new activity synced, old data remains

### Test 4: Multi-Device Sync
1. Device A: Create goal
2. Device B: Logs in, auto-syncs
3. Verify Device B receives goal from Device A

---

## Error Handling Strategy

| Scenario | Handling |
|----------|----------|
| Migration hook fails | Manual migration runs on sync init |
| Missing `_synced` field | Treated as: needs migration |
| Missing `_rev` | Default to 1 |
| Missing `_id` | Use record `id` |
| Sync network error | Retry on next sync cycle (60s) |
| Partial sync failure | Mark only successful records as synced |

