import { database } from './firebase';
import { ref, get, set, push, update, remove, query, limitToFirst } from 'firebase/database';
import { TestRecord, Project } from '@/types';

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

/**
 * Obtener registros filtrados por proyecto
 */
export async function getRecordsByProject(projectId: string): Promise<TestRecord[]> {
  try {
    const allRecords = await getAllRecords();
    return allRecords.filter((record) => record.projectId === projectId);
  } catch (error) {
    console.error('Error fetching records by project:', error);
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

/**
 * Migración: Actualizar registros existentes para agregar projectId
 * Ejecuta UNA SOLA VEZ para asignar 'sumo' como proyecto a todos los registros sin projectId
 */
export async function migrateRecordsToProject(projectId: string = 'sumo'): Promise<number> {
  try {
    const records = await getAllRecords();
    let migratedCount = 0;

    for (const record of records) {
      // Si el registro no tiene projectId, lo asignamos
      if (!record.projectId) {
        const recordRef = ref(database, `records/${record.id}`);
        await update(recordRef, { projectId });
        migratedCount++;
      }
    }

    console.log(`✅ Migración completada: ${migratedCount} registros actualizados`);
    return migratedCount;
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

/**
 * ========== PROYECTOS ==========
 */

/**
 * Obtener todos los proyectos desde Firebase
 */
export async function getProjects(): Promise<Project[]> {
  try {
    const projectsRef = ref(database, 'projects');
    const snapshot = await get(projectsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const data = snapshot.val();
    return Object.entries(data).map(([id, project]: [string, any]) => ({
      ...project,
      id,
    }));
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

/**
 * Crear un nuevo proyecto
 */
export async function addProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
  try {
    const projectsRef = ref(database, 'projects');
    const newProjectRef = push(projectsRef);
    const projectId = newProjectRef.key || `proj-${Date.now()}`;
    
    const newProject: Project = {
      id: projectId,
      ...project,
      createdAt: new Date().toISOString(),
    };
    
    await set(newProjectRef, newProject);
    return newProject;
  } catch (error) {
    console.error('Error adding project:', error);
    throw error;
  }
}

/**
 * Crear un proyecto con ID específico (usado para el proyecto "Sumo" por defecto)
 */
export async function createProjectWithId(id: string, project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
  try {
    const projectRef = ref(database, `projects/${id}`);
    
    const newProject: Project = {
      id,
      ...project,
      createdAt: new Date().toISOString(),
    };
    
    await set(projectRef, newProject);
    return newProject;
  } catch (error) {
    console.error('Error creating project with ID:', error);
    throw error;
  }
}

/**
 * Actualizar un proyecto
 */
export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  try {
    // Proteger el proyecto "sumo" de ser eliminado
    if (id === 'sumo' && updates.id) {
      throw new Error('No se puede cambiar el ID del proyecto Sumo');
    }
    
    const projectRef = ref(database, `projects/${id}`);
    const snapshot = await get(projectRef);
    
    if (!snapshot.exists()) {
      throw new Error('Project not found');
    }
    
    const currentData = snapshot.val();
    const updatedData = { ...currentData, ...updates };
    await set(projectRef, updatedData);
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

/**
 * Eliminar un proyecto (NO se puede eliminar "sumo")
 * También elimina todos los registros asociados
 */
export async function deleteProject(id: string): Promise<void> {
  try {
    // Proteger el proyecto "sumo"
    if (id === 'sumo') {
      throw new Error('No se puede eliminar el proyecto Sumo (respaldo de datos)');
    }
    
    // Eliminar todos los registros del proyecto
    const records = await getRecordsByProject(id);
    for (const record of records) {
      await deleteRecord(record.id);
    }
    
    // Eliminar el proyecto
    const projectRef = ref(database, `projects/${id}`);
    await remove(projectRef);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

/**
 * Obtener proyecto por ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const projectRef = ref(database, `projects/${id}`);
    const snapshot = await get(projectRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return {
      id,
      ...snapshot.val(),
    };
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}
