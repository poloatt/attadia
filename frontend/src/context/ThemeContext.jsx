import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0099ff',
    },
    secondary: {
      main: '#7c3aed',
    },
    background: {
      default: '#1a1b1e',
      paper: '#25262b',
      toolbar: 'rgba(26, 27, 30, 0.8)'
    },
    text: {
      primary: '#e6e6e6',
      secondary: '#a6a7ab',
    },
    divider: 'rgba(140, 140, 140, 0.15)',
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle1: {
      fontSize: '0.813rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '0.813rem',
    },
    body2: {
      fontSize: '0.75rem',
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(26, 27, 30, 0.8)',
          borderBottom: '1px solid rgba(140, 140, 140, 0.15)',
          boxShadow: 'none',
          height: 48,
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '40px !important',
          padding: '0 !important',
          '& .MuiIconButton-root': {
            color: 'text.secondary',
            '&:hover': {
              color: 'text.primary'
            }
          }
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1a1b1e',
          borderRight: '1px solid rgba(140, 140, 140, 0.15)',
          '& .MuiListItemButton-root': {
            minHeight: 40,
            padding: '4px 12px',
            margin: '2px 4px',
            borderRadius: 1,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 32,
          color: '#a6a7ab',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: '0.813rem',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: 6,
          color: 'text.secondary',
          '&:hover': {
            color: 'text.primary',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }
        },
        sizeSmall: {
          padding: 4,
          '& .MuiSvgIcon-root': {
            fontSize: '1.125rem'
          }
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '6px 16px',
        },
        sizeSmall: {
          padding: '4px 12px',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.813rem',
          minHeight: 32,
          padding: '4px 12px',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (min-width:600px)': {
            paddingLeft: '16px',
            paddingRight: '16px',
          }
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(140, 140, 140, 0.15)'
        }
      }
    }
  },
});

export default theme;
