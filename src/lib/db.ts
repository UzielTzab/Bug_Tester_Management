import fs from 'fs';
import path from 'path';
import { TestDatabase, TestRecord } from '@/types';

const DB_PATH = path.join(process.cwd(), 'src', 'data', 'database.json');

export function readDatabase(): TestDatabase {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { records: [], lastId: 0 };
  }
}

export function writeDatabase(data: TestDatabase): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function getAllRecords(): TestRecord[] {
  const db = readDatabase();
  return db.records;
}

export function addRecord(record: Omit<TestRecord, 'id' | 'fechaCreacion'>): TestRecord {
  const db = readDatabase();
  const newId = db.lastId + 1;
  const newRecord: TestRecord = {
    ...record,
    id: `BUG-${String(newId).padStart(4, '0')}`,
    fechaCreacion: new Date().toISOString(),
  };
  db.records.push(newRecord);
  db.lastId = newId;
  writeDatabase(db);
  return newRecord;
}

export function updateRecord(id: string, updates: Partial<TestRecord>): TestRecord | null {
  const db = readDatabase();
  const index = db.records.findIndex((r) => r.id === id);
  if (index === -1) return null;
  db.records[index] = { ...db.records[index], ...updates };
  writeDatabase(db);
  return db.records[index];
}

export function deleteRecord(id: string): boolean {
  const db = readDatabase();
  const index = db.records.findIndex((r) => r.id === id);
  if (index === -1) return false;
  db.records.splice(index, 1);
  writeDatabase(db);
  return true;
}

export function deleteAllRecords(): boolean {
  const db = readDatabase();
  db.records = [];
  writeDatabase(db);
  return true;
}
