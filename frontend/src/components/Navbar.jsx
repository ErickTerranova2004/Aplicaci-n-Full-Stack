import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { usuario, autenticado, esAdmin, cerrarSesion } = useAuth();
  const navegar = useNavigate();

  const salir = () => {
    cerrarSesion();
    navegar('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-interior">
        <NavLink to="/" className="marca">
          <span className="marca-icono" aria-hidden="true">♥</span>
          Catálogo <span className="marca-tenue">&amp; Favoritos</span>
        </NavLink>

        <nav className="navbar-enlaces">
          <NavLink to="/" end>Catálogo</NavLink>
          {autenticado && <NavLink to="/favoritos">Mis favoritos</NavLink>}
          {esAdmin && <NavLink to="/admin/productos">Productos</NavLink>}
          {esAdmin && <NavLink to="/admin/reportes">Reportes</NavLink>}
        </nav>

        <div className="navbar-sesion">
          {autenticado ? (
            <>
              <span className="usuario-chip" title={usuario.correo}>
                {usuario.nombre}
                <span className={`rol rol-${usuario.rol}`}>{usuario.rol}</span>
              </span>
              <button type="button" className="btn btn-fantasma" onClick={salir}>Cerrar sesión</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-fantasma">Iniciar sesión</NavLink>
              <NavLink to="/registro" className="btn btn-primario">Crear cuenta</NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
