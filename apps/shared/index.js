// Punto de entrada principal para la librería shared 
// Exportar todo lo que necesitan las aplicaciones
// Test: Cambio para verificar rebuilds en Vercel

// Componentes
export * from './components/auth/index.js';
export * from './components/common/index.js';

// Context
export * from './context/AuthContext.jsx';
export * from './context/ThemeContext.jsx';
export * from './context/ValuesVisibilityContext.jsx';
export * from './context/NavigationBarContext.jsx';
export * from './context/SidebarContext.jsx';
export * from './context/RutinasContext.jsx';

// Hooks
export * from './hooks/index.js';

// Services
export * from './services/index.js';

// Utils
export * from './utils/index.js';

// Layouts
export * from './layouts/Layout.jsx';

// Navigation
export * from './navigation/index.js';

// Pages
export * from './pages/index.js';

// Styles (importar CSS)
import './index.css';

// Configuración
export * from './config/envConfig.js';
export * from './config/api.js';
export * from './config/axios.js';
export * from './config/uiConstants.js';
export * from './config/mercadopago.js';
