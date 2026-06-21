// Configuración específica para Foco
export const focoConfig = {
  name: 'Agenda',
  title: 'Agenda',
  description: 'Aplicación para gestión de hábitos, rutinas y productividad',
  
  // Puerto de desarrollo
  port: 5173,
  
  // Tema y colores
  theme: {
    primary: '#1976d2',
    name: 'blue',
    mode: 'light'
  },
  
  // URLs específicas
  urls: {
    development: 'http://localhost:5173',
    production: 'https://foco.attadia.com'
  },
  
  // Rutas principales de la app
  defaultRoute: '/foco',
  routes: {
    foco: '/foco',
    agenda: '/agenda',
    rutinas: '/rutinas',
    objetivos: '/objetivos', 
    tareas: '/tareas',
    archivo: '/archivo'
  },
  
  // Features habilitadas
  features: {
    foco: true,
    agenda: true,
    rutinas: true,
    objetivos: true,
    tareas: true,
    archivo: true,
    analytics: false,
    notifications: true
  }
}

export default focoConfig
