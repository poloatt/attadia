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
import { SeccionInquilinos, SeccionHabitaciones, SeccionInventario, SeccionDocumentos } from './SeccionesPropiedad';
import PropiedadGridView, { crearSeccionesPropiedad } from './PropiedadGridView';
import {
  pluralizar,
  getEstadoContrato,
  agruparHabitaciones,
  calcularProgresoOcupacion,
  getCuentaYMoneda,
  calcularYearToDate,
  calcularYearToGo
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
  
  // Calcular YTD y YTG
  const ytd = calcularYearToDate(propiedad);
  const ytg = calcularYearToGo(propiedad);

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

  // Usar el mismo sistema modular que PropiedadGridView
  const secciones = crearSeccionesPropiedad(
    propiedad,
    montoMensual,
    simboloMoneda,
    nombreCuenta,
    propiedad.moneda?.nombre,
    _habitaciones,
    _contratos,
    _inventarios,
    _documentos,
    true // extendida = true para vista lista
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
      <PropiedadGridView
        type="sections"
        sections={secciones}
        propiedad={propiedad}
        habitaciones={_habitaciones}
        contratos={_contratos}
        documentos={_documentos}
        precio={montoMensual}
        simboloMoneda={simboloMoneda}
        nombreCuenta={nombreCuenta}
        moneda={propiedad.moneda?.nombre}
        ciudad={ciudad}
        metrosCuadrados={metrosCuadrados}
        direccion={direccion}
      />
    </Box>
  );
};

export default PropiedadListView; 
