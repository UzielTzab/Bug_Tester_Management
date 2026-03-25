import { database } from './firebase';
import { ref, get, set, push, update, remove, query, limitToFirst } from 'firebase/database';
import { TestRecord } from '@/types';

export async function getAllRecords(): Promise<TestRecord[]> {
  try {
    const recordsRef = ref(database, 'records');
    const snapshot = await get(recordsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const data = snapshot.val();
    return Object.entries(data).map(([id, record]: [string, any]) => ({
      ...record,
      id,
    }));
  } catch (error) {
    console.error('Error fetching records:', error);
    return [];
  }
}

export async function addRecord(record: Omit<TestRecord, 'id' | 'fechaCreacion'>): Promise<TestRecord> {
  try {
    const recordsRef = ref(database, 'records');
    const newRecordRef = push(recordsRef);
    const recordId = newRecordRef.key || `BUG-${Date.now()}`;
    
    const newRecord: TestRecord = {
      ...record,
      id: recordId,
      fechaCreacion: new Date().toISOString(),
    };
    
    await set(newRecordRef, newRecord);
    return newRecord;
  } catch (error) {
    console.error('Error adding record:', error);
    throw error;
  }
}

export async function updateRecord(id: string, updates: Partial<TestRecord>): Promise<void> {
  try {
    const recordRef = ref(database, `records/${id}`);
    // Get current record first
    const snapshot = await get(recordRef);
    if (!snapshot.exists()) {
      throw new Error('Record not found');
    }
    // Merge updates with existing data
    const currentData = snapshot.val();
    const updatedData = { ...currentData, ...updates };
    await set(recordRef, updatedData);
  } catch (error) {
    console.error('Error updating record:', error);
    throw error;
  }
}

export async function deleteRecord(id: string): Promise<void> {
  try {
    const recordRef = ref(database, `records/${id}`);
    await remove(recordRef);
  } catch (error) {
    console.error('Error deleting record:', error);
    throw error;
  }
}

export async function deleteAllRecords(): Promise<void> {
  try {
    const recordsRef = ref(database, 'records');
    await remove(recordsRef);
  } catch (error) {
    console.error('Error deleting all records:', error);
    throw error;
  }
}
