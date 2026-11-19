// Ruta protegida (solo admin): CRUD de productos.
import { useEffect, useState } from 'react';
import { productosApi } from '../api/cliente';
import { Alerta, Campo, Confirmar, Toast, formatoPrecio } from '../components/Ui';

const VACIO = { nombre: '', descripcion: '', categoria: '', precio: '' };

function validar(f) {
  const e = {};
  if (!f.nombre.trim()) e.nombre = 'El nombre es obligatorio';
  if (!f.descripcion.trim()) e.descripcion = 'La descripción es obligatoria';
  if (!f.categoria.trim()) e.categoria = 'La categoría es obligatoria';
  const precio = Number(f.precio);
  if (f.precio === '' || Number.isNaN(precio)) e.precio = 'El precio es obligatorio y debe ser numérico';
  else if (precio <= 0) e.precio = 'El precio debe ser mayor que cero';
  else if (Math.round(precio * 100) / 100 !== precio) e.precio = 'Máximo 2 decimales';
  return e;
}

export default function AdminProductos() {
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [toast, setToast] = useState('');
  const [filtro, setFiltro] = useState('');

  const cargar = () => productosApi.listar().then((d) => setProductos(d.productos)).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, []);

  const cambiar = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrores((prev) => ({ ...prev, [e.target.name]: undefined })); // se limpia el error al corregir
  };

  const limpiar = () => { setForm(VACIO); setEditandoId(null); setErrores({}); };

  const editar = (p) => {
    setEditandoId(p.id);
    setForm({ nombre: p.nombre, descripcion: p.descripcion, categoria: p.categoria, precio: String(p.precio) });
    setErrores({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const guardar = async (e) => {
    e.preventDefault();
    const locales = validar(form);
    setErrores(locales);
    setError('');
    if (Object.keys(locales).length) return;

    const datos = { ...form, precio: Number(form.precio) };
    setGuardando(true);
    try {
      if (editandoId) {
        await productosApi.actualizar(editandoId, datos);
        setToast('Producto actualizado');
      } else {
        await productosApi.crear(datos);
        setToast('Producto creado');
      }
      limpiar();
      cargar();
    } catch (err) {
      setErrores(err.erroresPorCampo || {});
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    setEliminando(true);
    try {
      await productosApi.eliminar(aEliminar.id);
      setToast(`"${aEliminar.nombre}" eliminado (y quitado de los favoritos de todos)`);
      if (editandoId === aEliminar.id) limpiar();
      setAEliminar(null);
      cargar();
    } catch (err) {
      setError(err.message);
      setAEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  const visibles = productos.filter((p) =>
    `${p.nombre} ${p.categoria}`.toLowerCase().includes(filtro.toLowerCase()));

  return (
    <section>
      <div className="cabecera-pagina">
        <div>
          <p className="sobretitulo">Administración · rol admin</p>
          <h1>Gestión de productos</h1>
          <p className="subtitulo">Crear, editar y eliminar productos del catálogo.</p>
        </div>
      </div>

      <Alerta onCerrar={() => setError('')}>{error}</Alerta>

      <div className="admin-layout">
        <form className="panel formulario" onSubmit={guardar} noValidate>
          <h2>{editandoId ? 'Editar producto' : 'Nuevo producto'}</h2>
          <Campo etiqueta="Nombre" id="nombre" error={errores.nombre}>
            <input id="nombre" name="nombre" value={form.nombre} onChange={cambiar} maxLength={120} />
          </Campo>
          <Campo etiqueta="Descripción" id="descripcion" error={errores.descripcion}>
            <textarea id="descripcion" name="descripcion" rows={3} value={form.descripcion} onChange={cambiar} />
          </Campo>
          <div className="dos-columnas">
            <Campo etiqueta="Categoría" id="categoria" error={errores.categoria}>
              <input id="categoria" name="categoria" value={form.categoria} onChange={cambiar} list="categorias" maxLength={60} />
              <datalist id="categorias">
                {[...new Set(productos.map((p) => p.categoria))].map((c) => <option key={c} value={c} />)}
              </datalist>
            </Campo>
            <Campo etiqueta="Precio (USD)" id="precio" error={errores.precio}>
              <input id="precio" name="precio" type="number" step="0.01" min="0.01" value={form.precio} onChange={cambiar} />
            </Campo>
          </div>
          <div className="acciones-form">
            {editandoId && <button type="button" className="btn btn-fantasma" onClick={limpiar}>Cancelar</button>}
            <button type="submit" className="btn btn-primario" disabled={guardando}>
              {guardando ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>

        <div className="panel">
          <div className="panel-cabecera">
            <h2>Productos ({productos.length})</h2>
            <input className="filtro-tabla" placeholder="Filtrar…" value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar tabla" />
          </div>
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr><th>Nombre</th><th>Categoría</th><th className="num">Precio</th><th aria-label="Acciones" /></tr>
              </thead>
              <tbody>
                {visibles.map((p) => (
                  <tr key={p.id} className={editandoId === p.id ? 'fila-activa' : ''}>
                    <td><strong>{p.nombre}</strong><small className="id-texto">{p.id}</small></td>
                    <td><span className="etiqueta-tabla">{p.categoria}</span></td>
                    <td className="num">{formatoPrecio(p.precio)}</td>
                    <td className="acciones">
                      <button type="button" className="btn btn-fantasma btn-pequeno" onClick={() => editar(p)}>Editar</button>
                      <button type="button" className="btn btn-peligro-suave btn-pequeno" onClick={() => setAEliminar(p)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Confirmar
        abierto={Boolean(aEliminar)}
        titulo="¿Eliminar producto?"
        onCancelar={() => setAEliminar(null)}
        onAceptar={confirmarEliminar}
        procesando={eliminando}
      >
        Se eliminará <strong>{aEliminar?.nombre}</strong> y, en la misma transacción, se quitará de los favoritos de todos los usuarios. Esta acción no se puede deshacer.
      </Confirmar>
      <Toast mensaje={toast} onFin={() => setToast('')} />
    </section>
  );
}
