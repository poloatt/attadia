import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './components/PrivateRoute';
import { Login } from './pages/Login';
import { Propiedades } from './pages/Propiedades';
import { Layout } from './layouts/Layout';
import { Register } from './components/Register';
import Dashboard from './pages/Dashboard';
import Transacciones from './pages/Transacciones';
import Inventario from './pages/Inventario';
import Rutinas from './pages/Rutinas';
import Lab from './pages/Lab';
import Proyectos from './pages/Proyectos';
import Perfil from './pages/Perfil';

function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      
      {/* Rutas protegidas */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/propiedades" element={<Propiedades />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/transacciones" element={<Transacciones />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/rutinas" element={<Rutinas />} />
          <Route path="/lab" element={<Lab />} />
          <Route path="/proyectos" element={<Proyectos />} />
        </Route>
      </Route>

      {/* Redirigir a login si no hay ruta */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
