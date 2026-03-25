/**
 * Configuración de Proyectos
 * Define los proyectos y sus propiedades de identidad
 */

import { Project } from '@/types';

export const PROJECTS: Project[] = [
  {
    id: 'sumo',
    name: 'Proyecto Sumo',
    description: 'Proyecto principal con todos los registros de bugs',
    color: 'from-blue-500 to-cyan-500',
    icon: '🔵',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_PROJECT_ID = 'sumo';

/**
 * Colores por proyecto (para diseño)
 */
export const projectColors: Record<string, string> = {
  sumo: 'bg-gradient-to-r from-blue-500 to-cyan-500',
};

/**
 * Obtener proyecto por ID
 */
export function getProject(projectId: string): Project | undefined {
  return PROJECTS.find((p) => p.id === projectId);
}
