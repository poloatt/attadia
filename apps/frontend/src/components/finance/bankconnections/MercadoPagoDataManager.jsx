import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { api } from '../../../services/api';

export default function MercadoPagoDataManager({ conexionId, onDataProcessed }) {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Cargar datos completos
  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/bankconnections/mercadopago/datos-completos/${conexionId}`);
      setDatos(response.data);
      setSuccess('Datos cargados exitosamente');
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError(err.response?.data?.message || 'Error cargando datos de Mercado Pago');
    } finally {
      setLoading(false);
    }
  };

  // Procesar datos
  const procesarDatos = async (opciones = {}) => {
    try {
      setProcessing(true);
      setError(null);
      
      const response = await api.post(`/api/bankconnections/mercadopago/procesar-datos/${conexionId}`, opciones);
      
      setSuccess(`Datos procesados exitosamente: ${response.data.resumen.totalNuevas} nuevas, ${response.data.resumen.totalActualizadas} actualizadas`);
      
      // Notificar al componente padre
      if (onDataProcessed) {
        onDataProcessed(response.data);
      }
    } catch (err) {
      console.error('Error procesando datos:', err);
      setError(err.response?.data?.message || 'Error procesando datos de Mercado Pago');
    } finally {
      setProcessing(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (conexionId) {
      cargarDatos();
    }
  }, [conexionId]);

  // Formatear fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatear monto
  const formatearMonto = (monto, moneda = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda
    }).format(monto);
  };

  // Obtener color del estado
  const getEstadoColor = (estado) => {
    const colores = {
      'approved': 'success',
      'pending': 'warning',
      'in_process': 'info',
      'rejected': 'error',
      'cancelled': 'error',
      'refunded': 'error',
      'available': 'success'
    };
    return colores[estado] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header con acciones */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <Typography variant="h6" gutterBottom>
                Gestión de Datos Mercado Pago
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Obtén y procesa todos los datos de tu cuenta de Mercado Pago
              </Typography>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={cargarDatos}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Recargar
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => procesarDatos()}
                disabled={processing}
              >
                Procesar Datos
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Datos del usuario */}
      {datos?.usuario && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Información del Usuario
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  ID: {datos.usuario.id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Email: {datos.usuario.email}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Nickname: {datos.usuario.nickname}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  País: {datos.usuario.country_id}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Resumen de datos */}
      {datos?.resumen && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {datos.resumen.totalPagos}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pagos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="secondary">
                  {datos.resumen.totalMovimientos}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Movimientos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {datos.resumen.totalOrdenes}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Órdenes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Errores */}
      {datos?.errores && datos.errores.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" color="error" gutterBottom>
              <ErrorIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Errores en la Obtención de Datos
            </Typography>
            {datos.errores.map((error, index) => (
              <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                <strong>{error.tipo}:</strong> {error.error}
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Datos detallados */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Pagos ({datos?.pagos?.length || 0})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {datos?.pagos && datos.pagos.length > 0 ? (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Monto</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Método</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datos.pagos.slice(0, 10).map((pago) => (
                    <TableRow key={pago.id}>
                      <TableCell>{pago.id}</TableCell>
                      <TableCell>{pago.description || 'Sin descripción'}</TableCell>
                      <TableCell>
                        {formatearMonto(pago.transaction_amount, pago.currency_id)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={pago.status}
                          color={getEstadoColor(pago.status, 'PAGO')}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatearFecha(pago.date_created)}</TableCell>
                      <TableCell>{pago.payment_method?.type || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No hay pagos disponibles
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Movimientos de Cuenta ({datos?.movimientosCuenta?.length || 0})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {datos?.movimientosCuenta && datos.movimientosCuenta.length > 0 ? (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Monto</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datos.movimientosCuenta.slice(0, 10).map((movimiento) => (
                    <TableRow key={movimiento.id}>
                      <TableCell>{movimiento.id}</TableCell>
                      <TableCell>{movimiento.description || 'Sin descripción'}</TableCell>
                      <TableCell>
                        {formatearMonto(movimiento.amount, movimiento.currency_id)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={movimiento.type}
                          color={movimiento.type === 'credit' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={movimiento.status}
                          color={getEstadoColor(movimiento.status, 'MOVIMIENTO')}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatearFecha(movimiento.date_created)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No hay movimientos disponibles
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Órdenes de Comerciante ({datos?.ordenesComerciante?.length || 0})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {datos?.ordenesComerciante && datos.ordenesComerciante.length > 0 ? (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Monto</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datos.ordenesComerciante.slice(0, 10).map((orden) => (
                    <TableRow key={orden.id}>
                      <TableCell>{orden.id}</TableCell>
                      <TableCell>{orden.preference_id || 'Sin descripción'}</TableCell>
                      <TableCell>
                        {formatearMonto(orden.total_amount, orden.currency_id)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={orden.status}
                          color={getEstadoColor(orden.status, 'ORDEN')}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatearFecha(orden.date_created)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No hay órdenes disponibles
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Opciones de procesamiento */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Opciones de Procesamiento
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => procesarDatos({ procesarPagos: true, procesarMovimientos: false })}
                disabled={processing}
              >
                Solo Procesar Pagos
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => procesarDatos({ procesarPagos: false, procesarMovimientos: true })}
                disabled={processing}
              >
                Solo Procesar Movimientos
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
} 