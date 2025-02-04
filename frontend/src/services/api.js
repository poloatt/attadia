import clienteAxios from '../config/axios';

export const api = {
  // Auth
  login: (credentials) => clienteAxios.post('/auth/login', credentials),
  register: (userData) => clienteAxios.post('/auth/register', userData),
  logout: () => clienteAxios.post('/auth/logout'),
  
  // Perfil
  getPerfil: () => clienteAxios.get('/perfil'),
  updatePerfil: (data) => clienteAxios.put('/perfil', data),
  updatePassword: (data) => clienteAxios.put('/perfil/password', data),
  
  // Propiedades
  getPropiedades: () => clienteAxios.get('/propiedades'),
  createPropiedad: (data) => clienteAxios.post('/propiedades', data),
  updatePropiedad: (id, data) => clienteAxios.put(`/propiedades/${id}`, data),
  deletePropiedad: (id) => clienteAxios.delete(`/propiedades/${id}`),
  
  // Proyectos
  getProyectos: () => clienteAxios.get('/proyectos'),
  createProyecto: (data) => clienteAxios.post('/proyectos', data),
  updateProyecto: (id, data) => clienteAxios.put(`/proyectos/${id}`, data),
  deleteProyecto: (id) => clienteAxios.delete(`/proyectos/${id}`),

  // Tareas
  getTareas: () => clienteAxios.get('/tareas'),
  getTareasByProyecto: (proyectoId) => clienteAxios.get(`/tareas/proyecto/${proyectoId}`),
  createTarea: (data) => clienteAxios.post('/tareas', data),
  updateTarea: (id, data) => clienteAxios.put(`/tareas/${id}`, data),
  deleteTarea: (id) => clienteAxios.delete(`/tareas/${id}`),

  // Transacciones
  getTransacciones: () => clienteAxios.get('/transacciones'),
  createTransaccion: (data) => clienteAxios.post('/transacciones', data),
  updateTransaccion: (id, data) => clienteAxios.put(`/transacciones/${id}`, data),
  deleteTransaccion: (id) => clienteAxios.delete(`/transacciones/${id}`),

  // Monedas
  getMonedas: () => clienteAxios.get('/monedas'),
  
  // Cuentas
  getCuentas: () => clienteAxios.get('/cuentas'),
  createCuenta: (data) => clienteAxios.post('/cuentas', data),
  updateCuenta: (id, data) => clienteAxios.put(`/cuentas/${id}`, data),
  deleteCuenta: (id) => clienteAxios.delete(`/cuentas/${id}`)
};
