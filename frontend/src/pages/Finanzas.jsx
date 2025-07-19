import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EntityToolbar from '../components/EntityViews/EntityToolbar';
import { 
  AccountBalanceOutlined as BankIcon,
  CurrencyExchangeOutlined as CurrencyIcon,
  TrendingUpOutlined as TrendingIcon,
  PersonSearchOutlined as PersonIcon,
  RepeatOutlined as RepeatIcon,
  AttachMoneyOutlined as MoneyIcon
} from '@mui/icons-material';

const FinanzasCard = ({ title, description, icon: Icon, path, color = 'primary.main' }) => {
  const navigate = useNavigate();

  return (
    <Card 
      elevation={0}
      sx={{ 
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: color,
          transform: 'translateY(-2px)',
          boxShadow: 1
        }
      }}
    >
      <CardActionArea onClick={() => navigate(path)}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Icon sx={{ fontSize: 32, color, mr: 2 }} />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 500 }}>
              {title}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default function Finanzas() {
  const finanzasSections = [
    {
      title: 'Transacciones',
      description: 'Gestiona tus ingresos y gastos diarios, categoriza transacciones y mantén un control detallado de tu flujo de dinero.',
      icon: MoneyIcon,
      path: '/assets/finanzas/transacciones',
      color: '#4CAF50'
    },
    {
      title: 'Cuentas',
      description: 'Administra tus cuentas bancarias, efectivo, billeteras digitales y otros instrumentos financieros.',
      icon: BankIcon,
      path: '/assets/finanzas/cuentas',
      color: '#2196F3'
    },
    {
      title: 'Monedas',
      description: 'Configura y gestiona las diferentes monedas que utilizas en tus transacciones y cuentas.',
      icon: CurrencyIcon,
      path: '/assets/finanzas/monedas',
      color: '#FF9800'
    },
    {
      title: 'Inversiones',
      description: 'Realiza seguimiento de tus inversiones, portafolios y rendimientos financieros.',
      icon: TrendingIcon,
      path: '/assets/finanzas/inversiones',
      color: '#9C27B0'
    },
    {
      title: 'Deudores',
      description: 'Controla préstamos, deudas pendientes y gestiona cobros de manera eficiente.',
      icon: PersonIcon,
      path: '/assets/finanzas/deudores',
      color: '#F44336'
    },
    {
      title: 'Recurrente',
      description: 'Configura transacciones automáticas, suscripciones y pagos periódicos.',
      icon: RepeatIcon,
      path: '/assets/finanzas/recurrente',
      color: '#607D8B'
    }
  ];

  return (
    <Box sx={{ px: 0, width: '100%' }}>
      <EntityToolbar />
      
      <Box sx={{ 
        width: '100%',
        maxWidth: 1200,
        mx: 'auto',
        px: { xs: 1, sm: 2, md: 3 },
        py: 2,
        pb: { xs: 10, sm: 4 },
        boxSizing: 'border-box'
      }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
          Finanzas
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Gestiona todos los aspectos de tus finanzas personales desde un solo lugar
        </Typography>

        <Grid container spacing={3}>
          {finanzasSections.map((section) => (
            <Grid item xs={12} sm={6} md={4} key={section.path}>
              <FinanzasCard {...section} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
} 