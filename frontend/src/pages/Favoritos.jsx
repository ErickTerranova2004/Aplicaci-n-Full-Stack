// Ruta protegida: lista de favoritos del usuario autenticado.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { favoritosApi } from '../api/cliente';
import { useAuth } from '../context/AuthContext';
import { Alerta, Toast, Vacio, formatoPrecio } from '../components/Ui';

const formatoFecha = (iso) => new Date(iso).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' });

export default function Favoritos() {
  const { usuario } = useAuth();
  const [favoritos, setFavoritos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    favoritosApi.listar()
      .then((d) => setFavoritos(d.favoritos))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  const quitar = async (f) => {
    try {
      await favoritosApi.quitar(f.id);
      setFavoritos((lista) => lista.filter((x) => x.id !== f.id));
      setToast(`"${f.nombre}" se quitó de tus favoritos`);
    } catch (e) {
      setError(e.message);
    }
  };

  const total = favoritos.reduce((s, f) => s + f.precio, 0);

  return (
    <section>
      <div className="cabecera-pagina">
        <div>
          <p className="sobretitulo">Ruta protegida · requiere JWT</p>
          <h1>Mis favoritos</h1>
          <p className="subtitulo">Hola, {usuario.nombre}. Solo tú puedes ver y modificar esta lista.</p>
        </div>
        {favoritos.length > 0 && (
          <div className="resumen-mini">
            <span>{favoritos.length} producto{favoritos.length !== 1 && 's'}</span>
            <strong>{formatoPrecio(total)}</strong>
          </div>
        )}
      </div>

      <Alerta onCerrar={() => setError('')}>{error}</Alerta>

      {cargando ? (
        <p className="estado-carga">Cargando favoritos…</p>
      ) : favoritos.length === 0 ? (
        <Vacio titulo="Aún no tienes favoritos">
          Explora el <Link to="/">catálogo</Link> y toca el corazón de los productos que te gusten.
        </Vacio>
      ) : (
        <ul className="lista-favoritos">
          {favoritos.map((f) => (
            <li key={f.id} className="fila-favorito">
              <span className={`punto banda-${f.categoria}`} aria-hidden="true" />
              <div className="fila-info">
                <strong>{f.nombre}</strong>
                <small>{f.categoria} · agregado el {formatoFecha(f.agregado_en)}</small>
              </div>
              <span className="precio">{formatoPrecio(f.precio)}</span>
              <button type="button" className="btn btn-fantasma btn-pequeno" onClick={() => quitar(f)}>Quitar</button>
            </li>
          ))}
        </ul>
      )}
      <Toast mensaje={toast} onFin={() => setToast('')} />
    </section>
  );
}
