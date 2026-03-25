/**
 * Archivo de Configuración de Opciones
 * 
 * Modifica estos valores para cambiar las opciones disponibles en la aplicación
 * sin necesidad de editar el código principal.
 */

import { TipoError, Estado, Actor, DeviceType } from '@/types';

// ===== TIPOS DE ERROR =====
// Categorías de bugs/errores que pueden ser reportados
export const TIPOS_ERROR: TipoError[] = ['Diseño', 'Funcionalidad', 'Rendimiento', 'Seguridad'];

// ===== ESTADOS DEL BUG =====
// Estados del ciclo de vida de un bug
export const ESTADOS: Estado[] = ['Pendiente', 'En Progreso', 'Corregido', 'No es un Error'];

// ===== TIPOS DE USUARIO / ACTOR =====
// ✏️ EDITÁ AQUÍ PARA CAMBIAR LOS TIPOS DE USUARIO
// Cambia 'Invitado', 'Admin', 'Super Admin' por 'Cliente', 'Proveedor'
export const ACTORES: Actor[] = ['Cliente', 'Proveedor'];

// ===== TIPOS DE DISPOSITIVO =====
// Dispositivos donde se reporta el error
export const DISPOSITIVOS: DeviceType[] = ['Mobile', 'Desktop'];

// ===== COLORES POR TIPO DE ERROR =====
// Personaliza los colores para cada tipo de error
export const tipoColors: Record<TipoError, string> = {
  'Diseño': 'bg-pink-600 text-white',
  'Funcionalidad': 'bg-red-600 text-white',
  'Rendimiento': 'bg-yellow-500 text-black',
  'Seguridad': 'bg-purple-600 text-white',
};

// ===== COLORES POR ESTADO =====
// Personaliza los colores para cada estado
export const estadoColors: Record<Estado, string> = {
  'Pendiente': 'bg-gray-500 text-white',
  'En Progreso': 'bg-blue-600 text-white',
  'Corregido': 'bg-green-600 text-white',
  'No es un Error': 'bg-purple-600 text-white',
};

// ===== COLORES POR ACTOR / TIPO DE USUARIO =====
// Personaliza los colores para cada tipo de usuario
export const actorColors: Record<Actor, string> = {
  'Cliente': 'bg-indigo-500 text-white',
  'Proveedor': 'bg-pink-600 text-white',
};
