import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import RutaProtegida from './components/RutaProtegida';
import Catalogo from './pages/Catalogo';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Favoritos from './pages/Favoritos';
import AdminProductos from './pages/AdminProductos';
import Reportes from './pages/Reportes';
import NoEncontrado from './pages/NoEncontrado';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="contenedor">
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Catalogo />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Protegidas: requieren sesión (JWT) */}
          <Route path="/favoritos" element={<RutaProtegida><Favoritos /></RutaProtegida>} />

          {/* Protegidas: requieren rol admin */}
          <Route path="/admin/productos" element={<RutaProtegida rol="admin"><AdminProductos /></RutaProtegida>} />
          <Route path="/admin/reportes" element={<RutaProtegida rol="admin"><Reportes /></RutaProtegida>} />

          <Route path="*" element={<NoEncontrado />} />
        </Routes>
      </main>
      <footer className="pie">
        React · Node.js · Express · MongoDB · JWT
      </footer>
    </>
  );
}
