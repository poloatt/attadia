import React from 'react';
import {
  Person,
  Business,
  Home,
  AttachMoney,
  CheckCircle,
  Warning,
  Error
} from '@mui/icons-material';
import EntityGridView from './EntityGridView';

// Ejemplo de configuración para usuarios
const usuariosConfig = {
  getIcon: (usuario) => {
    const statusIcons = {
      'ACTIVO': CheckCircle,
      'PENDIENTE': Warning,
      'INACTIVO': Error
    };
    return statusIcons[usuario.estado] || Person;
  },
  getIconColor: (usuario) => {
    const statusColors = {
      'ACTIVO': '#4caf50',
      'PENDIENTE': '#ff9800',
      'INACTIVO': '#f44336'
    };
    return statusColors[usuario.estado] || '#9e9e9e';
  },
  getTitle: (usuario) => `${usuario.nombre} ${usuario.apellido}`,
  getSubtitle: (usuario) => usuario.email,
  getHoverInfo: (usuario) => `Último acceso: ${new Date(usuario.ultimoAcceso).toLocaleDateString()}`,
  getLinkTo: (usuario) => `/usuarios/${usuario._id}`
};

// Ejemplo de configuración para empresas
const empresasConfig = {
  getIcon: () => Business,
  getTitle: (empresa) => empresa.nombre,
  getSubtitle: (empresa) => empresa.industria,
  getHoverInfo: (empresa) => `${empresa.empleados} empleados`
};

// Ejemplo de configuración para propiedades
const propiedadesConfig = {
  getIcon: () => Home,
  getTitle: (propiedad) => propiedad.direccion,
  getSubtitle: (propiedad) => `${propiedad.ciudad}, ${propiedad.pais}`,
  getHoverInfo: (propiedad) => `${propiedad.metrosCuadrados}m² - ${propiedad.tipo}`
};

// Ejemplo de datos de información financiera
const datosFinancieros = [
  {
    icon: AttachMoney,
    label: 'Ingresos',
    value: '$50,000',
    color: 'success.main'
  },
  {
    icon: AttachMoney,
    label: 'Gastos',
    value: '$30,000',
    color: 'error.main'
  },
  {
    icon: AttachMoney,
    label: 'Balance',
    value: '$20,000',
    color: 'primary.main'
  }
];

// Ejemplo de uso del componente EntityGridView
const EntityGridViewExample = () => {
  // Datos de ejemplo
  const usuarios = [
    { _id: '1', nombre: 'Juan', apellido: 'Pérez', email: 'juan@example.com', estado: 'ACTIVO', ultimoAcceso: new Date() },
    { _id: '2', nombre: 'María', apellido: 'García', email: 'maria@example.com', estado: 'PENDIENTE', ultimoAcceso: new Date() },
    { _id: '3', nombre: 'Carlos', apellido: 'López', email: 'carlos@example.com', estado: 'INACTIVO', ultimoAcceso: new Date() }
  ];

  const empresas = [
    { _id: '1', nombre: 'TechCorp', industria: 'Tecnología', empleados: 150 },
    { _id: '2', nombre: 'FoodInc', industria: 'Alimentación', empleados: 75 },
    { _id: '3', nombre: 'BuildCo', industria: 'Construcción', empleados: 200 }
  ];

  const propiedades = [
    { _id: '1', direccion: 'Calle Principal 123', ciudad: 'Madrid', pais: 'España', metrosCuadrados: 120, tipo: 'Apartamento' },
    { _id: '2', direccion: 'Avenida Central 456', ciudad: 'Barcelona', pais: 'España', metrosCuadrados: 200, tipo: 'Casa' }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Ejemplos de EntityGridView</h2>
      
      {/* Ejemplo 1: Lista de usuarios */}
      <EntityGridView
        type="list"
        data={usuarios}
        config={usuariosConfig}
        title="Usuarios"
        gridSize={{ xs: 12, sm: 6, md: 4, lg: 3 }}
        emptyMessage="No hay usuarios registrados"
      />

      {/* Ejemplo 2: Lista de empresas */}
      <EntityGridView
        type="list"
        data={empresas}
        config={empresasConfig}
        title="Empresas"
        gridSize={{ xs: 6, sm: 6, md: 4, lg: 3 }}
        emptyMessage="No hay empresas registradas"
      />

      {/* Ejemplo 3: Lista de propiedades con vista compacta */}
      <EntityGridView
        type="list"
        data={propiedades}
        config={propiedadesConfig}
        title="Propiedades"
        isCompact={true}
        fixedSlots={6}
        itemsPerPage={6}
        gridSize={{ xs: 6, sm: 4, md: 3, lg: 2 }}
        emptyMessage="No hay propiedades registradas"
      />

      {/* Ejemplo 4: Información financiera */}
      <EntityGridView
        type="info"
        data={datosFinancieros}
        title="Resumen Financiero"
        gridSize={{ xs: 12, sm: 4, md: 4, lg: 4 }}
      />

      {/* Ejemplo 5: Lista vacía */}
      <EntityGridView
        type="list"
        data={[]}
        config={usuariosConfig}
        title="Lista Vacía"
        emptyMessage="Esta lista está vacía"
      />
    </div>
  );
};

export default EntityGridViewExample; 
