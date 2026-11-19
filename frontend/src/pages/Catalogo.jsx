// Página pública: catálogo con filtro por categoría y búsqueda.
// Si hay sesión, el corazón agrega/quita favoritos (ruta protegida de la API).
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productosApi, favoritosApi } from '../api/cliente';
import { useAuth } from '../context/AuthContext';
import ProductoCard from '../components/ProductoCard';
import { Alerta, Toast, Vacio } from '../components/Ui';

export default function Catalogo() {
  const { autenticado } = useAuth();
  const navegar = useNavigate();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState('');
  const [buscar, setBuscar] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [favoritos, setFavoritos] = useState(new Set());
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [procesandoId, setProcesandoId] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    productosApi.categorias().then((d) => setCategorias(d.categorias)).catch(() => {});
  }, []);

  useEffect(() => {
    setCargando(true);
    setError('');
    productosApi.listar({ categoria, buscar: busquedaAplicada })
      .then((d) => setProductos(d.productos))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [categoria, busquedaAplicada]);

  useEffect(() => {
    if (!autenticado) { setFavoritos(new Set()); return; }
    favoritosApi.listar().then((d) => setFavoritos(new Set(d.favoritos.map((f) => f.id)))).catch(() => {});
  }, [autenticado]);

  const alternarFavorito = useCallback(async (producto) => {
    if (!autenticado) {
      navegar('/login', { state: { desde: '/', motivo: 'Inicia sesión para guardar productos en tus favoritos.' } });
      return;
    }
    setProcesandoId(producto.id);
    try {
      if (favoritos.has(producto.id)) {
        await favoritosApi.quitar(producto.id);
        setFavoritos((s) => { const n = new Set(s); n.delete(producto.id); return n; });
        setToast(`"${producto.nombre}" se quitó de tus favoritos`);
      } else {
        await favoritosApi.agregar(producto.id);
        setFavoritos((s) => new Set(s).add(producto.id));
        setToast(`"${producto.nombre}" se agregó a tus favoritos`);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setProcesandoId(null);
    }
  }, [autenticado, favoritos, navegar]);

  const enviarBusqueda = (e) => {
    e.preventDefault();
    setBusquedaAplicada(buscar.trim());
  };

  return (
    <section>
      <div className="cabecera-pagina">
        <div>
          <p className="sobretitulo">Catálogo público</p>
          <h1>Encuentra y guarda tus productos favoritos</h1>
          <p className="subtitulo">
            Cualquiera puede consultar el catálogo. Para guardar favoritos necesitas una cuenta.
          </p>
        </div>
        <form className="buscador" onSubmit={enviarBusqueda} role="search">
          <input
            type="search"
            placeholder="Buscar por nombre o descripción…"
            value={buscar}
            onChange={(e) => { setBuscar(e.target.value); if (!e.target.value) setBusquedaAplicada(''); }}
            aria-label="Buscar productos"
          />
          <button type="submit" className="btn btn-primario">Buscar</button>
        </form>
      </div>

      <div className="filtros" role="group" aria-label="Filtrar por categoría">
        <button type="button" className={`chip ${categoria === '' ? 'activo' : ''}`} onClick={() => setCategoria('')}>Todas</button>
        {categorias.map((c) => (
          <button type="button" key={c} className={`chip ${categoria === c ? 'activo' : ''}`} onClick={() => setCategoria(c)}>{c}</button>
        ))}
      </div>

      <Alerta onCerrar={() => setError('')}>{error}</Alerta>

      {cargando ? (
        <p className="estado-carga">Cargando productos…</p>
      ) : productos.length === 0 ? (
        <Vacio titulo="No hay productos que coincidan">Prueba con otra categoría o búsqueda.</Vacio>
      ) : (
        <>
          <p className="conteo">{productos.length} producto{productos.length !== 1 && 's'}</p>
          <div className="grilla">
            {productos.map((p) => (
              <ProductoCard
                key={p.id}
                producto={p}
                esFavorito={favoritos.has(p.id)}
                onAlternarFavorito={alternarFavorito}
                procesando={procesandoId === p.id}
              />
            ))}
          </div>
        </>
      )}
      <Toast mensaje={toast} onFin={() => setToast('')} />
    </section>
  );
}
