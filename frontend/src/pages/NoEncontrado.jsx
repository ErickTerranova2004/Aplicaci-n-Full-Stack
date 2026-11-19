import { Link } from 'react-router-dom';

export default function NoEncontrado() {
  return (
    <section className="pagina-estado">
      <p className="codigo-estado">404</p>
      <h1>Página no encontrada</h1>
      <p>La dirección que buscas no existe.</p>
      <Link to="/" className="btn btn-primario">Ir al catálogo</Link>
    </section>
  );
}
