import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { EntityToolbar } from '../components/EntityViews';
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
  const navigate = useNavigate();
  const finanzasSections = [
    {
      title: 'Transacciones',
      // description: 'Gestiona tus ingresos y gastos diarios, categoriza transacciones y mantén un control detallado de tu flujo de dinero.',
      icon: MoneyIcon,
      path: '/assets/finanzas/transacciones',
      color: '#4CAF50'
    },
    {
      title: 'Cuentas',
      // description: 'Administra tus cuentas bancarias, efectivo, billeteras digitales y otros instrumentos financieros.',
      icon: BankIcon,
      path: '/assets/finanzas/cuentas',
      color: '#2196F3'
    },
    {
      title: 'Monedas',
      // description: 'Configura y gestiona las diferentes monedas que utilizas en tus transacciones y cuentas.',
      icon: CurrencyIcon,
      path: '/assets/finanzas/monedas',
      color: '#FF9800'
    },
    {
      title: 'Inversiones',
      // description: 'Realiza seguimiento de tus inversiones, portafolios y rendimientos financieros.',
      icon: TrendingIcon,
      path: '/assets/finanzas/inversiones',
      color: '#9C27B0'
    },
    {
      title: 'Deudores',
      // description: 'Controla préstamos, deudas pendientes y gestiona cobros de manera eficiente.',
      icon: PersonIcon,
      path: '/assets/finanzas/deudores',
      color: '#F44336'
    },
    {
      title: 'Recurrente',
      // description: 'Configura transacciones automáticas, suscripciones y pagos periódicos.',
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
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Grid container spacing={2} justifyContent="center" alignItems="center" sx={{ width: '100%', maxWidth: 700 }}>
          {finanzasSections.map((section, idx) => (
            <Grid item xs={6} sm={4} md={3} key={section.path} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Card 
                elevation={0}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: section.color,
                    transform: 'translateY(-2px)',
                    boxShadow: 1
                  },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 90,
                  maxWidth: 160,
                  width: '100%',
                  cursor: 'pointer',
                  borderRadius: 2,
                  px: 0.5,
                  py: 1.2,
                  bgcolor: '#181818'
                }}
                onClick={() => navigate(section.path)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                  <section.icon sx={{ fontSize: 32, color: idx % 2 === 0 ? '#fff' : '#bdbdbd' }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 500, textAlign: 'center', color: '#fff', fontSize: '1rem' }}>
                  {section.title}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
} 