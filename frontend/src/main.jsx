import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { SnackbarProvider } from 'notistack'
import { 
  BrowserRouter, 
  RouterProvider, 
  createBrowserRouter 
} from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SidebarProvider } from './context/SidebarContext'
import App from './App'
import theme from './theme'

// Configuración para React Router v7
const router = createBrowserRouter([
  {
    path: "*",
    element: (
      <AuthProvider>
        <SidebarProvider>
          <App />
        </SidebarProvider>
      </AuthProvider>
    ),
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider 
        maxSnack={3} 
        anchorOrigin={{ 
          vertical: 'bottom', 
          horizontal: 'right' 
        }}
      >
        <RouterProvider router={router} />
      </SnackbarProvider>
    </ThemeProvider>
  </React.StrictMode>,
) 