import Dexie from 'dexie';

export const db = new Dexie('ProgressTrackerDB');

db.version(1).stores({
  goals: '++id, title, status, start_date, end_date',
  activities: '++id, goalId, title, points, status'
});
