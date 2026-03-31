export type TipoError = 'Diseño' | 'Funcionalidad' | 'Rendimiento' | 'Seguridad';
export type Estado = 'Pendiente' | 'En Progreso' | 'Corregido' | 'No es un Error';
export type Actor = 'Cliente' | 'Proveedor';
export type DeviceType = 'Mobile' | 'Desktop';

export interface TestRecord {
  id: string;
  projectId: string; // Nuevo: ID del proyecto al que pertenece
  actor: Actor;
  modulo: string;
  tipoError?: TipoError;
  device?: DeviceType;
  resolution?: string;
  titulo: string;
  pasosReproducir: string;
  resultadoEsperado: string;
  resultadoActual: string;
  evidencia: string[];
  estado: Estado;
  notasDev: string;
  fechaCreacion: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string; // Color de identidad
  icon: string; // Emoji o icono
  actors?: string[]; // Actores personalizados por proyecto
  createdAt: string;
}

export interface TestDatabase {
  records: TestRecord[];
  lastId: number;
}

