import 'server-only';
import { neon } from '@neondatabase/serverless';
import { TestRecord, Project } from '@/types';

const databaseUrl = process.env.DATABASE_URL;

const sql = neon(databaseUrl || 'postgresql://placeholder');

function validateDatabase() {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured. Set it in your environment variables.');
  }
}

let schemaReady = false;

async function ensureSchema(): Promise<void> {
  validateDatabase();
  if (schemaReady) return;

  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      actors JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      actor TEXT NOT NULL,
      modulo TEXT NOT NULL,
      tipo_error TEXT,
      device TEXT,
      resolution TEXT,
      titulo TEXT NOT NULL,
      pasos_reproducir TEXT NOT NULL DEFAULT '',
      resultado_esperado TEXT NOT NULL DEFAULT '',
      resultado_actual TEXT NOT NULL DEFAULT '',
      evidencia JSONB NOT NULL DEFAULT '[]'::jsonb,
      estado TEXT NOT NULL,
      notas_dev TEXT NOT NULL DEFAULT '',
      fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_records_project_id ON records(project_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_records_fecha_creacion ON records(fecha_creacion DESC);`;

  schemaReady = true;
}

function toTestRecord(row: any): TestRecord {
  return {
    id: row.id,
    projectId: row.projectId,
    actor: row.actor,
    modulo: row.modulo,
    tipoError: row.tipoError ?? undefined,
    device: row.device ?? undefined,
    resolution: row.resolution ?? '',
    titulo: row.titulo,
    pasosReproducir: row.pasosReproducir ?? '',
    resultadoEsperado: row.resultadoEsperado ?? '',
    resultadoActual: row.resultadoActual ?? '',
    evidencia: Array.isArray(row.evidencia) ? row.evidencia : [],
    estado: row.estado,
    notasDev: row.notasDev ?? '',
    fechaCreacion: new Date(row.fechaCreacion).toISOString(),
  };
}

function toProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    color: row.color,
    icon: row.icon,
    actors: Array.isArray(row.actors) ? row.actors : [],
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getAllRecords(): Promise<TestRecord[]> {
  try {
    await ensureSchema();
    const rows = await sql`
      SELECT
        id,
        project_id AS "projectId",
        actor,
        modulo,
        tipo_error AS "tipoError",
        device,
        resolution,
        titulo,
        pasos_reproducir AS "pasosReproducir",
        resultado_esperado AS "resultadoEsperado",
        resultado_actual AS "resultadoActual",
        evidencia,
        estado,
        notas_dev AS "notasDev",
        fecha_creacion AS "fechaCreacion"
      FROM records
      ORDER BY fecha_creacion DESC;
    `;
    return rows.map(toTestRecord);
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
    await ensureSchema();
    const rows = await sql`
      SELECT
        id,
        project_id AS "projectId",
        actor,
        modulo,
        tipo_error AS "tipoError",
        device,
        resolution,
        titulo,
        pasos_reproducir AS "pasosReproducir",
        resultado_esperado AS "resultadoEsperado",
        resultado_actual AS "resultadoActual",
        evidencia,
        estado,
        notas_dev AS "notasDev",
        fecha_creacion AS "fechaCreacion"
      FROM records
      WHERE project_id = ${projectId}
      ORDER BY fecha_creacion DESC;
    `;
    return rows.map(toTestRecord);
  } catch (error) {
    console.error('Error fetching records by project:', error);
    return [];
  }
}

export async function addRecord(record: Omit<TestRecord, 'id' | 'fechaCreacion'>): Promise<TestRecord> {
  try {
    await ensureSchema();
    const recordId = generateId('BUG');
    const newRecord: TestRecord = {
      ...record,
      id: recordId,
      fechaCreacion: new Date().toISOString(),
    };

    await sql`
      INSERT INTO records (
        id, project_id, actor, modulo, tipo_error, device, resolution, titulo,
        pasos_reproducir, resultado_esperado, resultado_actual, evidencia, estado,
        notas_dev, fecha_creacion
      ) VALUES (
        ${newRecord.id},
        ${newRecord.projectId},
        ${newRecord.actor},
        ${newRecord.modulo},
        ${newRecord.tipoError ?? null},
        ${newRecord.device ?? null},
        ${newRecord.resolution ?? ''},
        ${newRecord.titulo},
        ${newRecord.pasosReproducir ?? ''},
        ${newRecord.resultadoEsperado ?? ''},
        ${newRecord.resultadoActual ?? ''},
        ${JSON.stringify(newRecord.evidencia ?? [])}::jsonb,
        ${newRecord.estado},
        ${newRecord.notasDev ?? ''},
        ${newRecord.fechaCreacion}
      );
    `;
    return newRecord;
  } catch (error) {
    console.error('Error adding record:', error);
    throw error;
  }
}

export async function updateRecord(id: string, updates: Partial<TestRecord>): Promise<void> {
  try {
    await ensureSchema();

    const rows = await sql`
      SELECT
        id,
        project_id AS "projectId",
        actor,
        modulo,
        tipo_error AS "tipoError",
        device,
        resolution,
        titulo,
        pasos_reproducir AS "pasosReproducir",
        resultado_esperado AS "resultadoEsperado",
        resultado_actual AS "resultadoActual",
        evidencia,
        estado,
        notas_dev AS "notasDev",
        fecha_creacion AS "fechaCreacion"
      FROM records
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      throw new Error('Record not found');
    }

    const currentData = toTestRecord(rows[0]);
    const merged = { ...currentData, ...updates };

    await sql`
      UPDATE records
      SET
        project_id = ${merged.projectId},
        actor = ${merged.actor},
        modulo = ${merged.modulo},
        tipo_error = ${merged.tipoError ?? null},
        device = ${merged.device ?? null},
        resolution = ${merged.resolution ?? ''},
        titulo = ${merged.titulo},
        pasos_reproducir = ${merged.pasosReproducir ?? ''},
        resultado_esperado = ${merged.resultadoEsperado ?? ''},
        resultado_actual = ${merged.resultadoActual ?? ''},
        evidencia = ${JSON.stringify(merged.evidencia ?? [])}::jsonb,
        estado = ${merged.estado},
        notas_dev = ${merged.notasDev ?? ''}
      WHERE id = ${id};
    `;
  } catch (error) {
    console.error('Error updating record:', error);
    throw error;
  }
}

export async function deleteRecord(id: string): Promise<void> {
  try {
    await ensureSchema();
    await sql`DELETE FROM records WHERE id = ${id};`;
  } catch (error) {
    console.error('Error deleting record:', error);
    throw error;
  }
}

export async function deleteAllRecords(): Promise<void> {
  try {
    await ensureSchema();
    await sql`DELETE FROM records;`;
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
    await ensureSchema();
    const updated = await sql`
      UPDATE records
      SET project_id = ${projectId}
      WHERE project_id IS NULL OR project_id = ''
      RETURNING id;
    `;

    const migratedCount = updated.length;

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
 * Obtener todos los proyectos
 */
export async function getProjects(): Promise<Project[]> {
  try {
    await ensureSchema();
    const rows = await sql`
      SELECT
        id,
        name,
        description,
        color,
        icon,
        actors,
        created_at AS "createdAt"
      FROM projects
      ORDER BY created_at ASC;
    `;
    return rows.map(toProject);
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
    await ensureSchema();
    const projectId = generateId('proj');

    const newProject: Project = {
      id: projectId,
      ...project,
      createdAt: new Date().toISOString(),
    };

    await sql`
      INSERT INTO projects (id, name, description, color, icon, actors, created_at)
      VALUES (
        ${newProject.id},
        ${newProject.name},
        ${newProject.description ?? ''},
        ${newProject.color},
        ${newProject.icon},
        ${JSON.stringify(newProject.actors ?? [])}::jsonb,
        ${newProject.createdAt}
      );
    `;

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
    await ensureSchema();

    const newProject: Project = {
      id,
      ...project,
      createdAt: new Date().toISOString(),
    };

    await sql`
      INSERT INTO projects (id, name, description, color, icon, actors, created_at)
      VALUES (
        ${newProject.id},
        ${newProject.name},
        ${newProject.description ?? ''},
        ${newProject.color},
        ${newProject.icon},
        ${JSON.stringify(newProject.actors ?? [])}::jsonb,
        ${newProject.createdAt}
      )
      ON CONFLICT (id) DO NOTHING;
    `;

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
    await ensureSchema();

    // Proteger el proyecto "sumo" de ser eliminado
    if (id === 'sumo' && updates.id) {
      throw new Error('No se puede cambiar el ID del proyecto Sumo');
    }

    const rows = await sql`
      SELECT
        id,
        name,
        description,
        color,
        icon,
        actors,
        created_at AS "createdAt"
      FROM projects
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      throw new Error('Project not found');
    }

    const currentData = toProject(rows[0]);
    const merged = { ...currentData, ...updates };

    await sql`
      UPDATE projects
      SET
        name = ${merged.name},
        description = ${merged.description ?? ''},
        color = ${merged.color},
        icon = ${merged.icon},
        actors = ${JSON.stringify(merged.actors ?? [])}::jsonb
      WHERE id = ${id};
    `;
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
    await ensureSchema();

    // Proteger el proyecto "sumo"
    if (id === 'sumo') {
      throw new Error('No se puede eliminar el proyecto Sumo (respaldo de datos)');
    }

    await sql`DELETE FROM projects WHERE id = ${id};`;
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
    await ensureSchema();
    const rows = await sql`
      SELECT
        id,
        name,
        description,
        color,
        icon,
        actors,
        created_at AS "createdAt"
      FROM projects
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return null;
    }

    return toProject(rows[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}
