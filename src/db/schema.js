import Dexie from 'dexie';

export const db = new Dexie('ProgressTrackerDB');

// v5 stores definition (kept for upgrade reference)
db.version(5).stores({
  users: '++id, &email, password, name',
  goals: '++id, userId, status, [userId+status]',
  activities: '++id, userId, goalId, date, [userId+goalId+date], [userId+status]'
});

// v6: Add sync metadata fields
// This version adds _synced index for querying unsynced records
db.version(6).stores({
  users: '++id, &email, password, name',
  goals: '++id, userId, status, [userId+status], _synced',
  activities: '++id, userId, goalId, date, [userId+goalId+date], [userId+status], _synced'
});

/**
 * CRITICAL MIGRATION HOOK
 * Upgrades existing data from v5 to v6 by adding sync metadata
 * All existing data is marked as _synced: true (already persisted locally)
 */
db.version(5).upgrade(async (tx) => {
  console.log('🔄 Migrating from v5 to v6...');
  
  try {
    // Migrate users
    await tx.table('users').toCollection().modify((user) => {
      if (user._synced === undefined) {
        user._synced = true;  // Existing data is considered synced
        user._syncedAt = Date.now();
        user._rev = user._rev || 1;
        user._id = user._id || user.id;
        console.log(`✓ Migrated user: ${user.email}`);
      }
    });
    
    // Migrate goals
    await tx.table('goals').toCollection().modify((goal) => {
      if (goal._synced === undefined) {
        goal._synced = true;  // Existing data is considered synced
        goal._syncedAt = Date.now();
        goal._rev = goal._rev || 1;
        goal._id = goal._id || goal.id;
        console.log(`✓ Migrated goal: ${goal.title}`);
      }
    });
    
    // Migrate activities
    await tx.table('activities').toCollection().modify((activity) => {
      if (activity._synced === undefined) {
        activity._synced = true;  // Existing data is considered synced
        activity._syncedAt = Date.now();
        activity._rev = activity._rev || 1;
        activity._id = activity._id || activity.id;
        console.log(`✓ Migrated activity: ${activity.title || activity.id}`);
      }
    });
    
    console.log('✅ Migration complete! All existing data now has sync metadata.');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
});
