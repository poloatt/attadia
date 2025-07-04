import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffffff',
    },
    secondary: {
      main: '#cccccc',
    },
    background: {
      default: '#1a1a1a',
      paper: '#1a1a1a',
      toolbar: 'rgba(26, 26, 26, 0.8)'
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
          backgroundColor: 'rgba(26, 26, 26, 0.8)',
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
          backgroundColor: '#1a1a1a',
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
          padding: 8,
          color: 'text.secondary',
          '&:hover': {
            color: 'text.primary',
            backgroundColor: 'transparent'
          }
        },
        sizeSmall: {
          padding: 4,
          '& .MuiSvgIcon-root': {
            fontSize: '1.25rem'
          }
        }
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          padding: '6px 12px',
          '&:hover': {
            backgroundColor: 'transparent'
          }
        },
        text: {
          padding: '6px 8px',
          minWidth: 'auto'
        },
        sizeSmall: {
          padding: '4px 8px',
          '& .MuiSvgIcon-root': {
            fontSize: '1.25rem'
          }
        }
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
            paddingLeft: '0px',
            paddingRight: '0px',
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
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1a1a1a'
        }
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          '& .MuiTypography-root': {
            fontSize: '1rem',
            fontWeight: 600
          }
        }
      }
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '16px',
          '&:first-of-type': {
            paddingTop: '16px'
          }
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
          borderRadius: 4,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(140, 140, 140, 0.2)'
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(140, 140, 140, 0.4)'
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.3)'
          }
        },
        input: {
          padding: '8px 12px',
          height: '20px',
          lineHeight: '20px',
          fontSize: '0.813rem'
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.813rem',
          transform: 'translate(14px, 12px) scale(1)',
          '&.Mui-focused, &.MuiFormLabel-filled': {
            transform: 'translate(14px, -9px) scale(0.75)'
          }
        },
        outlined: {
          '&.MuiInputLabel-shrink': {
            transform: 'translate(14px, -9px) scale(0.75)'
          }
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.813rem',
          backgroundColor: 'transparent',
          '& .MuiInputAdornment-root': {
            marginTop: '0 !important',
            height: '36px'
          }
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          height: '20px',
          lineHeight: '20px',
          '&.MuiInputBase-input': {
            paddingRight: '32px'
          }
        },
        icon: {
          right: 8
        }
      }
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            marginTop: 0
          }
        }
      }
    },
    MuiInputAdornment: {
      styleOverrides: {
        root: {
          marginTop: '0 !important',
          height: '36px',
          maxHeight: '36px',
          '& .MuiSvgIcon-root': {
            fontSize: '1.25rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }
        },
        positionStart: {
          marginLeft: 4,
          marginRight: 0
        }
      }
    }
  },
});

export default theme;
