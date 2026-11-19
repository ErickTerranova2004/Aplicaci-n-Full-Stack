import { Link } from 'react-router-dom';

export default function NoAutorizado() {
  return (
    <section className="pagina-estado">
      <p className="codigo-estado">403</p>
      <h1>Acceso no autorizado</h1>
      <p>Tu cuenta no tiene permisos de administrador para ver esta sección.</p>
      <Link to="/" className="btn btn-primario">Volver al catálogo</Link>
    </section>
  );
}
