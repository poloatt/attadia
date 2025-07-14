import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Divider,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Visibility as ReviewIcon,
  Description as ContractIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as AccountIcon,
  CalendarToday as CalendarIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  MeetingRoom as RoomIcon,
  AccountBalanceWalletOutlined as DepositIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { generarCuotasMensuales } from '../contratoUtils';

const ReviewCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 0,
  backgroundColor: alpha(theme.palette.background.paper, 0.5),
  border: `1px solid ${theme.palette.divider}`,
  height: '100%'
}));

const ReviewSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3)
}));

const ReviewStep = ({
  formData,
  relatedData,
  theme
}) => {
  const formatCurrency = (amount, currency = '$') => {
    return `${currency} ${parseFloat(amount || 0).toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatFechaCorta = (fecha) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-ES', {
      month: 'short',
      year: 'numeric'
    });
  };

  const getMonedaSimbolo = () => {
    const cuenta = relatedData.cuentas?.find(c => 
      c._id === formData.cuenta || c.id === formData.cuenta
    );
    return cuenta?.moneda?.simbolo || '$';
  };

  const getPropiedad = () => {
    return relatedData.propiedades?.find(p => 
      p._id === formData.propiedad || p.id === formData.propiedad
    );
  };

  const getHabitacion = () => {
    const propiedad = getPropiedad();
    if (!propiedad?.habitaciones) return null;
    
    return propiedad.habitaciones.find(h => 
      h._id === formData.habitacion || h.id === formData.habitacion
    );
  };

  const getInquilinos = () => {
    if (!formData.inquilino || !relatedData.inquilinos) return [];
    
    return relatedData.inquilinos.filter(inq => 
      formData.inquilino.includes(inq._id || inq.id)
    );
  };

  const getCuenta = () => {
    return relatedData.cuentas?.find(c => 
      c._id === formData.cuenta || c.id === formData.cuenta
    );
  };

  const calcularDuracion = () => {
    if (!formData.fechaInicio || !formData.fechaFin) return null;
    
    const inicio = new Date(formData.fechaInicio);
    const fin = new Date(formData.fechaFin);
    const meses = (fin.getFullYear() - inicio.getFullYear()) * 12 + 
                 (fin.getMonth() - inicio.getMonth()) + 1;
    const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    
    if (meses > 1) {
      return `${meses} meses`;
    } else {
      return `${dias} días`;
    }
  };

  const calcularAlquilerMensual = () => {
    if (!formData.precioTotal || !formData.fechaInicio || !formData.fechaFin || formData.esMantenimiento) {
      return 0;
    }
    
    const inicio = new Date(formData.fechaInicio);
    const fin = new Date(formData.fechaFin);
    const mesesTotales = (fin.getFullYear() - inicio.getFullYear()) * 12 + 
                        (fin.getMonth() - inicio.getMonth()) + 1;
    
    return Math.round((parseFloat(formData.precioTotal) / mesesTotales) * 100) / 100;
  };

  const generarCuotas = () => {
    if (formData.esMantenimiento) return [];
    
    return generarCuotasMensuales({
      fechaInicio: formData.fechaInicio,
      fechaFin: formData.fechaFin,
      precioTotal: parseFloat(formData.precioTotal) || 0,
      esMantenimiento: false
    });
  };

  const monedaSimbolo = getMonedaSimbolo();
  const propiedad = getPropiedad();
  const habitacion = getHabitacion();
  const inquilinos = getInquilinos();
  const cuenta = getCuenta();
  const duracion = calcularDuracion();
  const alquilerMensual = calcularAlquilerMensual();
  const cuotas = generarCuotas();

  const getPropertyIcon = (tipo) => {
    const iconMap = {
      'CASA': HomeIcon,
      'DEPARTAMENTO': HomeIcon,
      'APARTAMENTO': HomeIcon,
      'LOCAL': HomeIcon
    };
    return iconMap[tipo] || HomeIcon;
  };

  const getTipoContratoLabel = () => {
    if (formData.esMantenimiento) return 'Mantenimiento';
    return formData.tipoContrato === 'ALQUILER' ? 'Alquiler' : formData.tipoContrato;
  };

  const getTipoContratoColor = () => {
    if (formData.esMantenimiento) return 'warning.main';
    return 'primary.main';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Título del paso */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <ReviewIcon sx={{ fontSize: '1.5rem', color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Revisar Contrato
        </Typography>
      </Box>

      {/* Alert de confirmación */}
      <Alert severity="info" sx={{ borderRadius: 0 }}>
        <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
          Revisa toda la información antes de crear el contrato
        </Typography>
        <Typography variant="body2">
          Una vez creado, podrás editar los detalles desde la vista de contratos.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Información Básica */}
        <Grid item xs={12} md={6}>
          <ReviewCard>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ContractIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Información Básica
              </Typography>
            </Box>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <Chip
                    label={getTipoContratoLabel()}
                    size="small"
                    sx={{ 
                      borderRadius: 0,
                      backgroundColor: alpha(getTipoContratoColor(), 0.1),
                      color: getTipoContratoColor()
                    }}
                  />
                </ListItemIcon>
                <ListItemText 
                  primary="Tipo de Contrato"
                  secondary={formData.esMantenimiento ? 'Contrato de servicios de mantenimiento' : 'Contrato de alquiler residencial'}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <CalendarIcon sx={{ color: 'text.secondary' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Período"
                  secondary={`${formatFecha(formData.fechaInicio)} - ${formatFecha(formData.fechaFin)}`}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <InfoIcon sx={{ color: 'text.secondary' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Duración"
                  secondary={duracion || 'No calculada'}
                />
              </ListItem>
              
              {formData.observaciones && (
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon sx={{ color: 'text.secondary' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Observaciones"
                    secondary={formData.observaciones}
                  />
                </ListItem>
              )}
            </List>
          </ReviewCard>
        </Grid>

        {/* Propiedad e Inquilinos */}
        <Grid item xs={12} md={6}>
          <ReviewCard>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <HomeIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Propiedad e Inquilinos
              </Typography>
            </Box>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  {propiedad && React.createElement(getPropertyIcon(propiedad.tipo), { 
                    sx: { color: 'text.secondary' } 
                  })}
                </ListItemIcon>
                <ListItemText 
                  primary="Propiedad"
                  secondary={propiedad ? `${propiedad.alias || 'Sin alias'} - ${propiedad.direccion}` : 'No seleccionada'}
                />
              </ListItem>
              
              {formData.esPorHabitacion && habitacion && (
                <ListItem>
                  <ListItemIcon>
                    <RoomIcon sx={{ color: 'text.secondary' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Habitación"
                    secondary={`${habitacion.nombre || 'Habitación'} - ${habitacion.metrosCuadrados || 'Sin medidas'}m²`}
                  />
                </ListItem>
              )}
              
              <ListItem>
                <ListItemIcon>
                  <PersonIcon sx={{ color: 'text.secondary' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Inquilinos"
                  secondary={inquilinos.length > 0 
                    ? inquilinos.map(inq => `${inq.nombre} ${inq.apellido}`).join(', ')
                    : 'No seleccionados'
                  }
                />
              </ListItem>
            </List>
          </ReviewCard>
        </Grid>

        {/* Términos Financieros */}
        <Grid item xs={12} md={6}>
          <ReviewCard>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <MoneyIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Términos Financieros
              </Typography>
            </Box>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <MoneyIcon sx={{ color: 'text.secondary' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Precio Total"
                  secondary={formatCurrency(formData.precioTotal, monedaSimbolo)}
                />
              </ListItem>
              
              {alquilerMensual > 0 && (
                <ListItem>
                  <ListItemIcon>
                    <PaymentIcon sx={{ color: 'text.secondary' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Alquiler Mensual"
                    secondary={formatCurrency(alquilerMensual, monedaSimbolo)}
                  />
                </ListItem>
              )}
              
              <ListItem>
                <ListItemIcon>
                  <AccountIcon sx={{ color: 'text.secondary' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Cuenta"
                  secondary={cuenta ? `${cuenta.nombre} (${cuenta.moneda?.simbolo})` : 'No seleccionada'}
                />
              </ListItem>
              
              {formData.deposito && parseFloat(formData.deposito) > 0 && (
                <ListItem>
                  <ListItemIcon>
                    <DepositIcon sx={{ color: 'text.secondary' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Depósito"
                    secondary={formatCurrency(formData.deposito, monedaSimbolo)}
                  />
                </ListItem>
              )}
              
              {formData.documentoUrl && (
                <ListItem>
                  <ListItemIcon>
                    <LinkIcon sx={{ color: 'text.secondary' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Documento"
                    secondary="URL del contrato proporcionada"
                  />
                </ListItem>
              )}
            </List>
          </ReviewCard>
        </Grid>

        {/* Cuotas y Pagos */}
        <Grid item xs={12} md={6}>
          <ReviewCard>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PaymentIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Cuotas y Pagos
              </Typography>
            </Box>
            
            {formData.esMantenimiento ? (
              <Alert severity="info" sx={{ borderRadius: 0 }}>
                Contrato de mantenimiento sin cuotas automáticas. 
                Los pagos se gestionarán manualmente.
              </Alert>
            ) : (
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon sx={{ color: 'text.secondary' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Total de Cuotas"
                    secondary={`${cuotas.length} cuotas mensuales`}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <MoneyIcon sx={{ color: 'text.secondary' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Total de Cuotas"
                    secondary={formatCurrency(
                      cuotas.reduce((sum, cuota) => sum + (cuota.monto || 0), 0),
                      monedaSimbolo
                    )}
                  />
                </ListItem>
                
                {cuotas.length > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon sx={{ color: 'success.main' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Primera Cuota"
                      secondary={`${formatFechaCorta(cuotas[0]?.fecha)} - ${formatCurrency(cuotas[0]?.monto, monedaSimbolo)}`}
                    />
                  </ListItem>
                )}
              </List>
            )}
          </ReviewCard>
        </Grid>
      </Grid>

      {/* Resumen Final */}
      <ReviewCard>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CheckIcon sx={{ color: 'success.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
            Resumen Final
          </Typography>
        </Box>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          <strong>Contrato de {getTipoContratoLabel().toLowerCase()}</strong> por{' '}
          <strong>{formatCurrency(formData.precioTotal, monedaSimbolo)}</strong>{' '}
          {duracion && `por ${duracion}`} entre{' '}
          <strong>{formatFecha(formData.fechaInicio)}</strong> y{' '}
          <strong>{formatFecha(formData.fechaFin)}</strong>.
        </Typography>
        
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {propiedad && `Propiedad: ${propiedad.alias || propiedad.direccion}`}
          {inquilinos.length > 0 && ` • Inquilinos: ${inquilinos.map(inq => `${inq.nombre} ${inq.apellido}`).join(', ')}`}
          {cuenta && ` • Cuenta: ${cuenta.nombre}`}
          {!formData.esMantenimiento && cuotas.length > 0 && ` • ${cuotas.length} cuotas mensuales`}
        </Typography>
      </ReviewCard>

      {/* Alertas finales */}
      {formData.esMantenimiento && (
        <Alert severity="warning" sx={{ borderRadius: 0 }}>
          <Typography variant="body2">
            <strong>Recordatorio:</strong> Los contratos de mantenimiento requieren gestión manual de pagos. 
            Asegúrate de registrar las transacciones según los servicios prestados.
          </Typography>
        </Alert>
      )}

      {cuenta?.tipo === 'DIGITAL' && (
        <Alert severity="success" sx={{ borderRadius: 0 }}>
          <Typography variant="body2">
            <strong>Ventaja:</strong> Cuenta digital seleccionada. Los pagos se pueden procesar automáticamente.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default ReviewStep; 