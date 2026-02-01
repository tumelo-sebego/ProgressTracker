import Dexie from 'dexie';

export const db = new Dexie('ProgressTrackerDB');

db.version(5).stores({
  users: '++id, &email, password, name',
  goals: '++id, userId, status, [userId+status]',
  activities: '++id, userId, goalId, date, [userId+goalId+date], [userId+status]'
});
