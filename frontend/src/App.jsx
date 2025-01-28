import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SidebarProvider } from './context/SidebarContext';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import Transacciones from './pages/Transacciones';
import Propiedades from './pages/Propiedades';
import Inventario from './pages/Inventario';
import Rutinas from './pages/Rutinas';
import Lab from './pages/Lab';
import Proyectos from './pages/Proyectos';

function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transacciones" element={<Transacciones />} />
            <Route path="/propiedades" element={<Propiedades />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/rutinas" element={<Rutinas />} />
            <Route path="/lab" element={<Lab />} />
            <Route path="/proyectos" element={<Proyectos />} />
          </Routes>
        </Layout>
      </SidebarProvider>
    </BrowserRouter>
  );
}

export default App;
