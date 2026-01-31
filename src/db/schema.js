import Dexie from 'dexie';

export const db = new Dexie('ProgressTrackerDB');

db.version(2).stores({
  goals: '++id, title, status, start_date, end_date',
  activities: '++id, goalId, title, points, status, date'
});
