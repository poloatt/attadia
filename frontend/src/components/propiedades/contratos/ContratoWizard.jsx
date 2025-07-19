import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Description as ContractIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
  Payment as PaymentIcon,
  Visibility as ReviewIcon
} from '@mui/icons-material';

// Componentes de pasos
import BasicInfoStep from './wizard/BasicInfoStep';
import PropertyTenantsStep from './wizard/PropertyTenantsStep';
import FinancialTermsStep from './wizard/FinancialTermsStep';
import PaymentsStep from './wizard/PaymentsStep';
import ReviewStep from './wizard/ReviewStep';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 0,
    backgroundColor: theme.palette.background.default,
    [theme.breakpoints.down('sm')]: {
      margin: 0,
      maxHeight: '100%',
      height: '100%',
      width: '100%',
      maxWidth: '100%'
    },
    [theme.breakpoints.up('sm')]: {
      minWidth: '700px',
      maxWidth: '900px',
      maxHeight: '90vh'
    }
  }
}));

const StyledStepper = styled(Stepper)(({ theme }) => ({
  '& .MuiStepLabel-root': {
    '& .MuiStepLabel-label': {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: theme.palette.text.primary
    },
    '& .MuiStepLabel-label.Mui-active': {
      color: theme.palette.primary.main,
      fontWeight: 600
    },
    '& .MuiStepLabel-label.Mui-completed': {
      color: theme.palette.success.main
    }
  },
  '& .MuiStepIcon-root': {
    borderRadius: 0,
    '&.Mui-active': {
      color: theme.palette.primary.main
    },
    '&.Mui-completed': {
      color: theme.palette.success.main
    }
  }
}));

const StepContentWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  minHeight: '400px',
  display: 'flex',
  flexDirection: 'column'
}));

const ActionButtons = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2, 3),
  borderTop: '1px solid rgba(255,255,255,0.1)',
  backgroundColor: theme.palette.background.paper
}));

const steps = [
  {
    label: 'Información Básica',
    icon: <ContractIcon />,
    description: 'Tipo de contrato y fechas principales'
  },
  {
    label: 'Propiedad e Inquilinos',
    icon: <HomeIcon />,
    description: 'Seleccionar propiedad y inquilinos'
  },
  {
    label: 'Términos Financieros',
    icon: <MoneyIcon />,
    description: 'Montos, cuenta y depósito'
  },
  {
    label: 'Cuotas y Pagos',
    icon: <PaymentIcon />,
    description: 'Configurar cuotas mensuales'
  },
  {
    label: 'Revisión',
    icon: <ReviewIcon />,
    description: 'Revisar y confirmar contrato'
  }
];

const ContratoWizard = ({
  open,
  onClose,
  onSubmit,
  initialData = {},
  relatedData = {},
  isSaving = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Paso 1: Información Básica
    tipoContrato: initialData.tipoContrato || 'ALQUILER',
    fechaInicio: initialData.fechaInicio ? new Date(initialData.fechaInicio) : null,
    fechaFin: initialData.fechaFin ? new Date(initialData.fechaFin) : null,
    observaciones: initialData.observaciones || '',
    
    // Paso 2: Propiedad e Inquilinos
    propiedad: initialData.propiedad?._id || initialData.propiedad || '',
    esPorHabitacion: initialData.esPorHabitacion || false,
    habitacion: initialData.habitacion?._id || initialData.habitacion || '',
    inquilino: initialData.inquilino || [],
    
    // Paso 3: Términos Financieros
    precioTotal: initialData.precioTotal?.toString() || '0',
    cuenta: initialData.cuenta?._id || initialData.cuenta || '',
    deposito: initialData.deposito?.toString() || '0',
    documentoUrl: initialData.documentoUrl || '',
    
    // Paso 4: Cuotas y Pagos
    cuotasMensuales: initialData.cuotasMensuales || []
  });

  const [errors, setErrors] = useState({});
  const [stepValidation, setStepValidation] = useState({
    0: false,
    1: false,
    2: false,
    3: false,
    4: false
  });

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleStepComplete = (stepIndex, isValid) => {
    setStepValidation(prev => ({
      ...prev,
      [stepIndex]: isValid
    }));
  };

  const handleFormDataChange = (newData) => {
    setFormData(prev => ({
      ...prev,
      ...newData
    }));
  };

  const handleErrorsChange = (newErrors) => {
    setErrors(prev => ({
      ...prev,
      ...newErrors
    }));
  };

  const handleSubmit = async () => {
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error al guardar contrato:', error);
    }
  };

  const canProceedToNext = stepValidation[activeStep];
  const canSubmit = Object.values(stepValidation).every(Boolean);

  const renderStepContent = () => {
    const commonProps = {
      formData,
      onFormDataChange: handleFormDataChange,
      onErrorsChange: handleErrorsChange,
      onStepComplete: handleStepComplete,
      errors,
      relatedData,
      theme
    };

    switch (activeStep) {
      case 0:
        return <BasicInfoStep {...commonProps} />;
      case 1:
        return <PropertyTenantsStep {...commonProps} />;
      case 2:
        return <FinancialTermsStep {...commonProps} />;
      case 3:
        return <PaymentsStep {...commonProps} />;
      case 4:
        return <ReviewStep {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="lg"
      fullWidth
    >
      {/* Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: theme.palette.background.paper
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ContractIcon sx={{ fontSize: '1.5rem', color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Crear Nuevo Contrato
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Paso {activeStep + 1} de {steps.length}: {steps[activeStep].label}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Progress Bar */}
      <LinearProgress
        variant="determinate"
        value={((activeStep + 1) / steps.length) * 100}
        sx={{
          height: 3,
          backgroundColor: 'rgba(255,255,255,0.1)',
          '& .MuiLinearProgress-bar': {
            backgroundColor: theme.palette.primary.main
          }
        }}
      />

      {/* Stepper */}
      <Box sx={{ p: 2, backgroundColor: theme.palette.background.paper }}>
        <StyledStepper activeStep={activeStep} alternativeLabel>
          {steps.map((step, index) => (
            <Step key={index}>
              <StepLabel
                icon={step.icon}
                optional={
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {step.description}
                  </Typography>
                }
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </StyledStepper>
      </Box>

      {/* Step Content */}
      <StepContentWrapper>
        {renderStepContent()}
      </StepContentWrapper>

      {/* Action Buttons */}
      <ActionButtons>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          sx={{ borderRadius: 0 }}
        >
          Anterior
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!canSubmit || isSaving}
              startIcon={isSaving ? null : <CheckIcon />}
              sx={{ borderRadius: 0 }}
            >
              {isSaving ? 'Guardando...' : 'Crear Contrato'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!canProceedToNext}
              endIcon={<ArrowForwardIcon />}
              sx={{ borderRadius: 0 }}
            >
              Siguiente
            </Button>
          )}
        </Box>
      </ActionButtons>
    </StyledDialog>
  );
};

export default ContratoWizard; 
