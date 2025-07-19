import React from 'react';
import {
  Box,
  Typography,
  Collapse,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  HomeWork,
  LocationOn,
  AttachMoney,
  BedOutlined as BedIcon,
  PeopleOutlined as PeopleIcon,
  Description as ContractIcon,
  Inventory2Outlined as InventoryIcon,
  AccountBalanceWalletOutlined as DepositIcon,
  MonetizationOnOutlined as MoneyIcon,
  OpenInNew as OpenInNewIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import ContratoDetail from './contratos/ContratoDetail';
import BarraEstadoPropiedad from './BarraEstadoPropiedad';
import {
  pluralizar,
  getEstadoContrato,
  agruparHabitaciones,
  calcularProgresoOcupacion,
  getCuentaYMoneda
} from './propiedadUtils';
import { getEstadoColor, getEstadoText, getStatusIconComponent } from '../common/StatusSystem';

// Función para calcular el monto mensual promedio desde contratos activos
const calcularMontoMensualDesdeContratos = (contratos = []) => {
  if (!contratos || contratos.length === 0) return 0;

  // Buscar contrato activo (no de mantenimiento)
  let contratoReferencia = contratos.find(contrato =>
    contrato.estado === 'ACTIVO' &&
    !contrato.esMantenimiento &&
    contrato.tipoContrato === 'ALQUILER'
  );

  // Si no hay activo, buscar planeado
  if (!contratoReferencia) {
    contratoReferencia = contratos.find(contrato =>
      contrato.estado === 'PLANEADO' &&
      !contrato.esMantenimiento &&
      contrato.tipoContrato === 'ALQUILER'
    );
  }

  // Si no hay planeado, buscar cualquier contrato de alquiler
  if (!contratoReferencia) {
    contratoReferencia = contratos.find(contrato =>
      !contrato.esMantenimiento &&
      contrato.tipoContrato === 'ALQUILER'
    );
  }

  if (!contratoReferencia) return 0;

  // Si el contrato tiene alquilerMensualPromedio calculado, usarlo
  if (contratoReferencia.alquilerMensualPromedio) {
    return contratoReferencia.alquilerMensualPromedio;
  }

  // Si no, calcularlo manualmente
  if (contratoReferencia.precioTotal && contratoReferencia.fechaInicio && contratoReferencia.fechaFin) {
    const inicio = new Date(contratoReferencia.fechaInicio);
    const fin = new Date(contratoReferencia.fechaFin);
    const mesesTotales = (fin.getFullYear() - inicio.getFullYear()) * 12 +
                        (fin.getMonth() - inicio.getMonth()) + 1;

    return Math.round((contratoReferencia.precioTotal / mesesTotales) * 100) / 100;
  }

  return 0;
};

// Sección: Progreso de ocupación
const ProgresoOcupacion = ({ propiedad }) => {
  // Lógica similar a calcularProgresoOcupacion de la card
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const contratoActivo = (propiedad.contratos || []).find(contrato => {
    const inicio = new Date(contrato.fechaInicio);
    const fin = new Date(contrato.fechaFin);
    return inicio <= hoy && fin >= hoy && contrato.estado === 'ACTIVO';
  });
  if (!contratoActivo) return null;
  const inicio = new Date(contratoActivo.fechaInicio);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(contratoActivo.fechaFin);
  fin.setHours(0, 0, 0, 0);
  const diasTotales = Math.max(0, Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)));
  const diasTranscurridos = Math.max(0, Math.min(diasTotales, Math.ceil((hoy - inicio) / (1000 * 60 * 60 * 24))));
  const diasRestantes = Math.max(0, Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24)));
  const porcentaje = diasTotales > 0 ? Math.min(100, (diasTranscurridos / diasTotales) * 100) : 0;
  const montoMensual = propiedad.alquilerMensualPromedio || 0;
  const montoAcumulado = (diasTranscurridos / 30) * montoMensual;
  const montoTotal = contratoActivo?.precioTotal || 0;
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Progreso de ocupación</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {diasTranscurridos}/{diasTotales} días ({Math.round(porcentaje)}%)
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Acumulado: ${montoAcumulado.toLocaleString()}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total: ${montoTotal.toLocaleString()}</Typography>
      </Box>
    </Box>
  );
};

// Sección: Financiera
const Financiera = ({ propiedad }) => {
  const simboloMoneda = propiedad.cuenta?.moneda?.simbolo || propiedad.moneda?.simbolo || '$';
  const montoMensual = calcularMontoMensualDesdeContratos(propiedad.contratos);
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Financiera</Typography>
      <Typography variant="body2">Mensualidad: {simboloMoneda} {montoMensual.toLocaleString()}</Typography>
      <Typography variant="body2">Depósito requerido: {simboloMoneda} {(montoMensual * 2).toLocaleString()}</Typography>
      <Typography variant="body2">Cuenta destino: {propiedad.cuenta?.nombre || 'No especificada'}</Typography>
    </Box>
  );
};

// Sección: Inquilinos
const InquilinosList = ({ inquilinos, inquilinosActivos, inquilinosFinalizados }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Inquilinos</Typography>
      {inquilinosActivos.length === 0 && <Typography variant="body2" color="text.secondary">Ninguno</Typography>}
      {inquilinosActivos.map(i => (
        <Typography key={i._id} variant="body2">{i.nombre} {i.apellido}</Typography>
      ))}
    <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 500 }}>
        {inquilinosFinalizados.length} {pluralizar(inquilinosFinalizados.length, 'inquilino finalizado', 'inquilinos finalizados')}
      </Typography>
      {inquilinosFinalizados.length === 0 && <Typography variant="body2" color="text.secondary">Ninguno</Typography>}
      {inquilinosFinalizados.map(i => (
        <Typography key={i._id} variant="body2">{i.nombre} {i.apellido} ({i.estado})</Typography>
      ))}
    </Box>
  );

// Sección: Contratos
const ContratosList = ({ contratos }) => {
  if (!contratos || contratos.length === 0) return null;
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Contratos</Typography>
      {contratos.map((contrato, idx) => {
          const estado = getEstadoContrato(contrato);
          const color = getEstadoColor(estado, 'CONTRATO');
          const icon = getStatusIconComponent(estado, 'CONTRATO');
          const text = getEstadoText(estado, 'CONTRATO');
          return (
          <Box key={contrato._id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography component={Link} to={`/contratos/${contrato._id}`} variant="body2" sx={{ color: color, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
              Contrato {idx + 1}
              </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {icon}
              <Typography variant="caption" sx={{ color: color }}>{text}</Typography>
            </Box>
            </Box>
          );
        })}
    </Box>
  );
};

// Sección: Habitaciones
const HabitacionesList = ({ habitaciones }) => {
  if (!habitaciones || habitaciones.length === 0) return null;
  // Agrupar por tipo
  const agrupadas = habitaciones.reduce((acc, hab) => {
    const tipo = hab.tipo === 'OTRO' ? hab.nombrePersonalizado : hab.tipo;
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(hab);
    return acc;
  }, {});
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Habitaciones</Typography>
      {Object.entries(agrupadas).map(([tipo, habs]) => (
        <Typography key={tipo} variant="body2" color="text.secondary">
          {habs.length} {tipo.replace('_', ' ')}{habs.length > 1 ? 's' : ''}
        </Typography>
      ))}
    </Box>
  );
};

// Sección: Inventario
const InventarioList = ({ inventario }) => {
  if (!inventario || inventario.length === 0) return null;
  // Agrupar por categoría
  const agrupado = inventario.reduce((acc, item) => {
    const categoria = item.categoria || 'Sin categoría';
    if (!acc[categoria]) acc[categoria] = [];
    acc[categoria].push(item);
    return acc;
  }, {});
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Inventario</Typography>
      {Object.entries(agrupado).map(([categoria, items]) => (
        <Box key={categoria}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{categoria} ({items.length})</Typography>
          {items.map(item => (
            <Typography key={item._id} variant="body2" color="text.secondary" sx={{ pl: 1 }}>
              {item.nombre} - Cantidad: {item.cantidad || 1}
            </Typography>
          ))}
        </Box>
      ))}
    </Box>
  );
};

// Sección: Documentos
const DocumentosList = ({ documentos }) => {
  if (!documentos || documentos.length === 0) return null;
  // Agrupar por categoría
  const categorias = ['CONTRATO', 'PAGO', 'COBRO', 'MANTENIMIENTO', 'GASTO_FIJO', 'GASTO_VARIABLE', 'ALQUILER'];
  const docsPorCategoria = categorias.reduce((acc, cat) => {
    acc[cat] = documentos.filter(doc => doc.categoria === cat);
    return acc;
  }, {});
        return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Documentos</Typography>
      {categorias.map(cat => {
        const docs = docsPorCategoria[cat];
        if (!docs || docs.length === 0) return null;
        return (
          <Box key={cat} sx={{ mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{cat.replace('_', ' ')}</Typography>
            {docs.map(doc => (
              <Box key={doc._id} sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.nombre}</Typography>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>Abrir</a>
              </Box>
            ))}
          </Box>
        );
      })}
    </Box>
  );
};

// Sección: Ubicación
const Ubicacion = ({ propiedad }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Ubicación</Typography>
    <Typography variant="body2" color="text.secondary">Dirección: {propiedad.direccion}</Typography>
    <Typography variant="body2" color="text.secondary">Ciudad: {propiedad.ciudad}</Typography>
    <Typography variant="body2" color="text.secondary">Superficie: {propiedad.metrosCuadrados}m²</Typography>
  </Box>
);

// Componente principal extendido
const PropiedadListView = ({ propiedad, inquilinos = [], inquilinosActivos = [], inquilinosFinalizados = [], habitaciones = [], contratos = [], inventarios = [], documentos = [] }) => {
  // Si no se pasan props individuales, usar los del objeto propiedad
  const _inquilinos = inquilinos.length ? inquilinos : (propiedad.inquilinos || []);
  const _habitaciones = habitaciones.length ? habitaciones : (propiedad.habitaciones || []);
  const _contratos = contratos.length ? contratos : (propiedad.contratos || []);
  const _inventarios = inventarios.length ? inventarios : (propiedad.inventarios || []);
  const _documentos = documentos.length ? documentos : (propiedad.documentos || []);
  const _inquilinosActivos = inquilinosActivos.length ? inquilinosActivos : _inquilinos.filter(i => i.estado === 'ACTIVO');
  const _inquilinosFinalizados = inquilinosFinalizados.length ? inquilinosFinalizados : _inquilinos.filter(i => i.estado !== 'ACTIVO');

  // Extraer valores clave
  const direccion = propiedad.direccion || '';
  const ciudad = propiedad.ciudad || '';
  const metrosCuadrados = propiedad.metrosCuadrados || 0;
  const montoMensual = propiedad.alquilerMensualPromedio || 0;

  // Usar la función centralizada para obtener cuenta y moneda
  const { simboloMoneda, nombreCuenta } = getCuentaYMoneda(propiedad, {});

  const totalHabitaciones = (propiedad.habitaciones || []).length;
  const dormitorios = (propiedad.habitaciones || []).filter(h => h.tipo === 'DORMITORIO_SIMPLE' || h.tipo === 'DORMITORIO_DOBLE').length;
  const totalInventarios = (propiedad.inventarios || []).length;
  const totalDocumentos = (propiedad.documentos || []).length;
  const contratoActivo = _contratos.find(c => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicio = new Date(c.fechaInicio);
    const fin = new Date(c.fechaFin);
    return inicio <= hoy && fin >= hoy && c.estado === 'ACTIVO';
  });
  const montoTotal = contratoActivo ? (() => {
    const inicio = new Date(contratoActivo.fechaInicio);
    const fin = new Date(contratoActivo.fechaFin);
    const diasTotales = Math.max(0, Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)));
    return contratoActivo.precioTotal || 0;
  })() : 0;

  const [openContrato, setOpenContrato] = React.useState(false);
  const [contratoSeleccionado, setContratoSeleccionado] = React.useState(null);

  const progresoOcupacion = contratoActivo ? {
    diasTranscurridos: Math.max(0, Math.ceil((new Date() - new Date(contratoActivo.fechaInicio)) / (1000 * 60 * 60 * 24))),
    diasTotales: Math.max(0, Math.ceil((new Date(contratoActivo.fechaFin) - new Date(contratoActivo.fechaInicio)) / (1000 * 60 * 60 * 24))),
    porcentaje: Math.min(100, (Math.min(Math.max(0, Math.ceil((new Date() - new Date(contratoActivo.fechaInicio)) / (1000 * 60 * 60 * 24))), Math.max(0, Math.ceil((new Date(contratoActivo.fechaFin) - new Date(contratoActivo.fechaInicio)) / (1000 * 60 * 60 * 24)))) / Math.max(1, Math.ceil((new Date(contratoActivo.fechaFin) - new Date(contratoActivo.fechaInicio)) / (1000 * 60 * 60 * 24)))) * 100),
    estado: getEstadoContrato(contratoActivo),
    montoAcumulado: (Math.min(Math.max(0, Math.ceil((new Date() - new Date(contratoActivo.fechaInicio)) / (1000 * 60 * 60 * 24))), Math.max(0, Math.ceil((new Date(contratoActivo.fechaFin) - new Date(contratoActivo.fechaInicio)) / (1000 * 60 * 60 * 24)))) / 30) * montoMensual,
    montoTotal: (Math.max(0, Math.ceil((new Date(contratoActivo.fechaFin) - new Date(contratoActivo.fechaInicio)) / (1000 * 60 * 60 * 24))) / 30) * montoMensual
  } : {
    diasTranscurridos: 0,
    diasTotales: 0,
    porcentaje: 0,
    estado: 'PENDIENTE',
    montoAcumulado: 0,
    montoTotal: 0
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
      {/* Ubicación */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
        <HomeWork sx={{ fontSize: '1.1rem', color: 'text.primary' }} />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{direccion}</Typography>
          <Typography variant="caption" color="text.secondary">{ciudad}</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>{metrosCuadrados}m²</Typography>
      </Box>
      {/* Financiera */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
        <AttachMoney sx={{ fontSize: '1.1rem', color: 'success.main' }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Typography variant="body2">{simboloMoneda} {montoMensual.toLocaleString()}</Typography>
          <Typography variant="caption" color="text.secondary">mensual</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>{nombreCuenta}</Typography>
        <MoneyIcon sx={{ fontSize: '1.1rem', color: 'text.secondary', ml: 1 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Typography variant="body2">{simboloMoneda} {montoTotal.toLocaleString()}</Typography>
          <Typography variant="caption" color="text.secondary">total</Typography>
        </Box>
      </Box>
      {/* Habitaciones */}
      <SeccionHabitaciones habitaciones={_habitaciones} />
      {/* Documentos (incluye contratos) */}
      <SeccionDocumentos documentos={[..._documentos, ..._contratos.map(contrato => ({
        ...contrato,
        nombre: `Contrato ${contrato._id}`,
        categoria: 'CONTRATO',
        url: contrato.documentoUrl || `/contratos/${contrato._id}`
      }))]} />
      {/* Inventario */}
    </Box>
  );
};

export default PropiedadListView; 
