import { Routes, Route } from 'react-router-dom';

import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Propiedades from './pages/Propiedades';
import Transacciones from './pages/Transacciones';
import Inventario from './pages/Inventario';
import Rutinas from './pages/Rutinas';
import Lab from './pages/Lab';
import Proyectos from './pages/Proyectos';
import Register from './components/Register';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/propiedades" element={<Propiedades />} />
        <Route path="/transacciones" element={<Transacciones />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/rutinas" element={<Rutinas />} />
        <Route path="/lab" element={<Lab />} />
        <Route path="/proyectos" element={<Proyectos />} />
      </Routes>
    </Layout>
  );
}

export default App;
