export type TipoError = 'Diseño' | 'Funcionalidad' | 'Rendimiento' | 'Seguridad';
export type Estado = 'Pendiente' | 'En Progreso' | 'Corregido' | 'No es un Error';
export type Actor = 'Invitado' | 'Admin' | 'Super Admin';
export type DeviceType = 'Mobile' | 'Desktop';

export interface TestRecord {
  id: string;
  actor: Actor;
  modulo: string;
  tipoError?: TipoError;
  device?: DeviceType;
  resolution?: string;
  titulo: string;
  pasosReproducir: string;
  resultadoEsperado: string;
  resultadoActual: string;
  evidencia: string;
  estado: Estado;
  notasDev: string;
  fechaCreacion: string;
}

export interface TestDatabase {
  records: TestRecord[];
  lastId: number;
}
