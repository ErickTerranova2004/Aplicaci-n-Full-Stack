// Protege rutas del Front-End:
//  - Sin sesión        -> redirige a /login (y luego vuelve a la página pedida).
//  - Sin el rol pedido -> muestra la página "Acceso no autorizado" (403).
// OJO: esto es solo experiencia de usuario. La seguridad real está en la API,
// que valida el JWT y el rol en cada petición.
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NoAutorizado from '../pages/NoAutorizado';

export default function RutaProtegida({ children, rol }) {
  const { autenticado, usuario, cargando } = useAuth();
  const ubicacion = useLocation();

  if (cargando) return <p className="estado-carga">Verificando sesión…</p>;
  if (!autenticado) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname, motivo: 'Inicia sesión para acceder a esta sección.' }} />;
  }
  if (rol && usuario.rol !== rol) return <NoAutorizado />;
  return children;
}
