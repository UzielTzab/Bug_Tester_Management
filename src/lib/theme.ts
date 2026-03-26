/**
 * Sistema de Temas Centralizado
 * Configuración única de colores, estilos y diseño para toda la aplicación
 * Compatible con Tailwind CSS
 */

// ============= CONFIGURACIÓN DEL TEMA =============
export const theme = {
  // Paleta de colores principal
  colors: {
    // Primarios y neutros
    primary: 'gray-900',
    secondary: 'gray-600',
    tertiary: 'gray-400',
    background: 'white',
    surface: 'gray-50',
    border: 'gray-200',
    divider: 'gray-300',
    
    // Estados
    success: 'green-600',
    successBg: 'green-50',
    successBorder: 'green-200',
    danger: 'red-600',
    dangerBg: 'red-50',
    dangerBorder: 'red-200',
    warning: 'amber-600',
    warningBg: 'amber-50',
    warningBorder: 'amber-200',
    info: 'blue-600',
    infoBg: 'blue-50',
    infoBorder: 'blue-200',
  },
  
  // Transiciones
  transitions: {
    fast: 'transition-all duration-150',
    normal: 'transition-all duration-300',
    smooth: 'transition-all duration-500',
  },
  
  // Sombras
  shadows: {
    xs: 'shadow-sm',
    sm: 'shadow-md',
    md: 'shadow-lg',
    lg: 'shadow-xl',
    xl: 'shadow-2xl',
  },
  
  // Radio de bordes
  radius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  },
};

// ============= CLASES DE COMPONENTES REUTILIZABLES =============
export const componentClasses = {
  // BOTONES
  buttons: {
    primary: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg border-none transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'px-4 py-2 bg-white border-2 border-gray-300 text-gray-900 font-semibold rounded-lg transition-all duration-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed',
    success: 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg border-none transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed',
    danger: 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg border-none transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed',
    warning: 'px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg border-none transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed',
    small: 'px-3 py-1 text-sm font-medium rounded-md transition-all duration-200',
  },
  
  // INPUTS
  inputs: {
    base: 'w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-200',
    sm: 'px-3 py-1 text-sm',
    error: 'border-red-500 focus:ring-red-600',
    disabled: 'bg-gray-100 cursor-not-allowed opacity-60',
  },
  
  // CARDS
  cards: {
    base: 'bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-4',
    elevated: 'bg-white rounded-lg border border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 p-6',
    compact: 'bg-white rounded-lg border border-gray-200 p-3',
  },
  
  // BADGES
  badges: {
    success: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300',
    danger: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300',
    warning: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300',
    info: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300',
    neutral: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300',
  },
  
  // MODALES
  modals: {
    overlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
    content: 'relative w-full max-w-lg sm:max-w-2xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200',
    header: 'text-2xl font-bold text-gray-900 mb-6',
    close: 'absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-2xl font-bold focus:outline-none',
  },
  
  // SIDEBAR
  sidebar: {
    container: 'w-64 bg-white border-r border-gray-200 shadow-lg p-6 fixed h-screen overflow-y-auto',
    title: 'text-lg font-bold text-gray-900 mb-6 flex items-center gap-3',
    item: 'w-full text-left p-3 rounded-lg border-2 border-transparent font-semibold transition-all duration-200 hover:bg-gray-100',
    itemActive: 'bg-blue-600 text-white border-blue-700 shadow-md scale-105',
    itemInactive: 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50',
  },
};

// ============= MAPEOS DE ESTADOS =============
export const stateColors = {
  'Pendiente': { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' },
  'En Progreso': { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
  'Corregido': { bg: 'bg-green-100', text: 'text-green-900', border: 'border-green-300' },
  'No es un Error': { bg: 'bg-gray-100', text: 'text-gray-900', border: 'border-gray-300' },
};

export const errorTypeColors = {
  'Diseño': { bg: 'bg-pink-100', text: 'text-pink-900', border: 'border-pink-300' },
  'Funcionalidad': { bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-300' },
  'Rendimiento': { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' },
  'Seguridad': { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300' },
};

// ============= ESQUEMAS DE COLOR PARA PROYECTOS =============
export const projectColorSchemes = [
  { gradient: 'from-blue-500 to-cyan-500', name: 'Azul' },
  { gradient: 'from-green-500 to-emerald-500', name: 'Verde' },
  { gradient: 'from-purple-500 to-pink-500', name: 'Púrpura' },
  { gradient: 'from-amber-400 to-orange-500', name: 'Naranja' },
  { gradient: 'from-red-500 to-pink-500', name: 'Rojo' },
  { gradient: 'from-indigo-500 to-blue-500', name: 'Índigo' },
];

export default theme;
