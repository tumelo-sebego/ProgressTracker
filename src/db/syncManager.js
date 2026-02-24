import client from '../api/client';
import { db } from './schema';

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = localStorage.getItem('lastSyncTime') || 0;
    this.syncInterval = 60000; // 60 seconds
    this.syncIntervalId = null;
  }

  /**
   * Check if records have missing sync metadata and migrate them
   * This is a safety net in case auto-migration fails
   */
  async checkAndMigrate() {
    console.log('🔍 Checking if migration needed...');
    
    try {
      // Try to query for records without _synced field
      // If the query fails, it means records exist without the field
      let needsMigration = false;

      // Check users
      const users = await db.users.toArray();
      for (const user of users) {
        if (user._synced === undefined) {
          needsMigration = true;
          break;
        }
      }

      if (!needsMigration) {
        // Check goals
        const goals = await db.goals.toArray();
        for (const goal of goals) {
          if (goal._synced === undefined) {
            needsMigration = true;
            break;
          }
        }
      }

      if (!needsMigration) {
        // Check activities
        const activities = await db.activities.toArray();
        for (const activity of activities) {
          if (activity._synced === undefined) {
            needsMigration = true;
            break;
          }
        }
      }

      if (needsMigration) {
        console.warn('⚠️ Found records without sync metadata. Running manual migration...');
        await this.manualMigration();
      } else {
        console.log('✅ All records have sync metadata');
      }
    } catch (error) {
      console.error('Migration check failed:', error);
    }
  }

  /**
   * Manually migrate all records that don't have sync metadata
   */
  async manualMigration() {
    try {
      console.log('🔄 Running manual migration...');

      // Migrate users
      const users = await db.users.toArray();
      for (const user of users) {
        if (user._synced === undefined) {
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
        if (goal._synced === undefined) {
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
        if (activity._synced === undefined) {
          await db.activities.update(activity.id, {
            _synced: true,
            _syncedAt: Date.now(),
            _rev: activity._rev || 1,
            _id: activity._id || activity.id
          });
          console.log(`✓ Manually migrated activity: ${activity.title || activity.id}`);
        }
      }

      console.log('✅ Manual migration complete');
    } catch (error) {
      console.error('❌ Manual migration failed:', error);
      throw error;
    }
  }

  /**
   * Start automatic sync every syncInterval milliseconds
   */
  async startAutoSync() {
    console.log('🚀 Starting auto-sync engine...');
    
    // Check for migration on startup
    await this.checkAndMigrate();
    
    // Perform initial sync immediately
    await this.performFullSync();
    
    // Then set up interval for periodic syncs
    this.syncIntervalId = setInterval(() => {
      this.performFullSync().catch(err => {
        console.error('Interval sync failed:', err);
      });
    }, this.syncInterval);
    
    console.log('✅ Auto-sync engine ready');
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
      console.log('⏸️ Auto-sync stopped');
    }
  }

  /**
   * Perform full sync cycle: push local changes, then pull remote changes
   */
  async performFullSync() {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress, skipping...');
      return;
    }
    
    this.isSyncing = true;
    try {
      console.log('🔄 Starting sync cycle...');
      
      // Step 1: Push local changes to server
      await this.pushLocalChanges();
      
      // Step 2: Pull server changes
      await this.pullRemoteChanges();
      
      this.lastSyncTime = Date.now();
      localStorage.setItem('lastSyncTime', this.lastSyncTime);
      console.log('✅ Sync cycle complete');
    } catch (error) {
      console.error('❌ Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Push local unsynced changes to server
   */
  async pushLocalChanges() {
    try {
      // Try to find unsynced records
      const unsyncedGoals = await db.goals.where('_synced').equals(false).toArray();
      const unsyncedActivities = await db.activities.where('_synced').equals(false).toArray();
      
      if (unsyncedGoals.length === 0 && unsyncedActivities.length === 0) {
        console.log('📦 No changes to push');
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

      console.log(`📤 Pushing ${unsyncedGoals.length + unsyncedActivities.length} changes...`);
      
      const response = await client.post('/sync/push', payload);

      // Mark records as synced
      for (const goal of unsyncedGoals) {
        const newRev = response.data?.goals?.[goal.id]?.rev || (goal._rev || 1) + 1;
        await db.goals.update(goal.id, {
          _synced: true,
          _syncedAt: Date.now(),
          _rev: newRev
        });
      }

      for (const activity of unsyncedActivities) {
        const newRev = response.data?.activities?.[activity.id]?.rev || (activity._rev || 1) + 1;
        await db.activities.update(activity.id, {
          _synced: true,
          _syncedAt: Date.now(),
          _rev: newRev
        });
      }

      console.log(`✅ Pushed ${unsyncedGoals.length + unsyncedActivities.length} changes`);
    } catch (error) {
      console.error('❌ Push failed:', error.message);
      throw error;
    }
  }

  /**
   * Pull remote changes from server
   */
  async pullRemoteChanges() {
    try {
      console.log('📥 Pulling remote changes...');
      
      const response = await client.get('/sync/pull', {
        params: { since: this.lastSyncTime }
      });

      const { goals = [], activities = [] } = response.data;

      // Upsert goals with safety checks
      for (const goal of goals) {
        const local = await db.goals.get(goal._id || goal.id);
        const localRev = local?._rev || 0;
        const remoteRev = goal._rev || 1;
        
        if (!local || localRev < remoteRev) {
          // Remote is newer
          await db.goals.put({ 
            ...goal, 
            id: goal._id || goal.id, 
            _synced: true,
            _rev: remoteRev,
            _id: goal._id || goal.id
          });
          console.log(`📥 Updated goal from server: ${goal.title}`);
        }
      }

      // Upsert activities with safety checks
      for (const activity of activities) {
        const local = await db.activities.get(activity._id || activity.id);
        const localRev = local?._rev || 0;
        const remoteRev = activity._rev || 1;
        
        if (!local || localRev < remoteRev) {
          // Remote is newer
          await db.activities.put({ 
            ...activity, 
            id: activity._id || activity.id, 
            _synced: true,
            _rev: remoteRev,
            _id: activity._id || activity.id
          });
          console.log(`📥 Updated activity from server: ${activity.id}`);
        }
      }

      console.log(`✅ Pulled ${goals.length + activities.length} remote changes`);
    } catch (error) {
      console.error('❌ Pull failed:', error.message);
      throw error;
    }
  }

  /**
   * Trigger sync immediately (useful after user actions)
   */
  async syncNow() {
    return this.performFullSync();
  }

  /**
   * Get current sync status
   */
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: new Date(this.lastSyncTime),
      syncInterval: this.syncInterval
    };
  }
}

export default new SyncManager();
