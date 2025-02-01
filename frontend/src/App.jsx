import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './components/PrivateRoute';
import { Login } from './pages/Login';
import { Propiedades } from './pages/Propiedades';
import { Layout } from './layouts/Layout';
import { Register } from './components/Register';
import Dashboard from './pages/Dashboard';
import Transacciones from './pages/Transacciones';
import Rutinas from './pages/Rutinas';
import Lab from './pages/Lab';
import Proyectos from './pages/Proyectos';
import Perfil from './pages/Perfil';
import { Habitaciones } from './pages/Habitaciones';
import { Monedas } from './pages/Monedas';
import { Cuentas } from './pages/Cuentas';
import { Inquilinos } from './pages/Inquilinos';
import { Contratos } from './pages/Contratos';
import { Inventario } from './pages/Inventario';

function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      
      {/* Rutas protegidas */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/propiedades" element={<Propiedades />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/transacciones" element={<Transacciones />} />
          <Route path="/rutinas" element={<Rutinas />} />
          <Route path="/lab" element={<Lab />} />
          <Route path="/proyectos" element={<Proyectos />} />
          <Route path="/habitaciones" element={<Habitaciones />} />
          <Route path="/monedas" element={<Monedas />} />
          <Route path="/cuentas" element={<Cuentas />} />
          <Route path="/inquilinos" element={<Inquilinos />} />
          <Route path="/contratos" element={<Contratos />} />
          <Route path="/inventario" element={<Inventario />} />
        </Route>
      </Route>

      {/* Redirigir a login si no hay ruta */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
