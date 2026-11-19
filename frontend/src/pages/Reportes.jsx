// Ruta protegida (solo admin): reportería generada con agregaciones de MongoDB.
import { useEffect, useState } from 'react';
import { reportesApi } from '../api/cliente';
import { Alerta, Vacio, formatoPrecio } from '../components/Ui';

export default function Reportes() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [descargando, setDescargando] = useState(false);

  const cargar = () => {
    setError('');
    reportesApi.resumen().then(setDatos).catch((e) => setError(e.message));
  };
  useEffect(cargar, []);

  const descargarCsv = async () => {
    setDescargando(true);
    try {
      const blob = await reportesApi.csv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-productos-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setDescargando(false);
    }
  };

  if (!datos) {
    return (
      <section>
        <Alerta onCerrar={() => setError('')}>{error}</Alerta>
        {!error && <p className="estado-carga">Generando reporte…</p>}
      </section>
    );
  }

  const { totales, porCategoria, masFavoritos } = datos;
  const maxProductos = Math.max(1, ...porCategoria.map((c) => c.productos));
  const maxVeces = Math.max(1, ...masFavoritos.map((m) => m.veces));

  return (
    <section>
      <div className="cabecera-pagina">
        <div>
          <p className="sobretitulo">Administración · consulta y reportería</p>
          <h1>Reportes</h1>
          <p className="subtitulo">Generado el {new Date(datos.generadoEn).toLocaleString('es-EC')}</p>
        </div>
        <div className="acciones-form">
          <button type="button" className="btn btn-fantasma" onClick={cargar}>Actualizar</button>
          <button type="button" className="btn btn-primario" onClick={descargarCsv} disabled={descargando}>
            {descargando ? 'Descargando…' : 'Descargar CSV'}
          </button>
        </div>
      </div>

      <Alerta onCerrar={() => setError('')}>{error}</Alerta>

      <div className="kpis">
        <div className="kpi"><span>Usuarios</span><strong>{totales.usuarios}</strong><small>{totales.administradores} admin</small></div>
        <div className="kpi"><span>Productos</span><strong>{totales.productos}</strong><small>{porCategoria.length} categorías</small></div>
        <div className="kpi"><span>Favoritos guardados</span><strong>{totales.favoritos}</strong><small>en total</small></div>
      </div>

      <div className="reportes-grid">
        <div className="panel">
          <h2>Productos por categoría</h2>
          <table className="tabla">
            <thead>
              <tr><th>Categoría</th><th>Productos</th><th className="num">Promedio</th><th className="num">Mín.</th><th className="num">Máx.</th></tr>
            </thead>
            <tbody>
              {porCategoria.map((c) => (
                <tr key={c.categoria}>
                  <td><span className="etiqueta-tabla">{c.categoria}</span></td>
                  <td>
                    <div className="barra-celda">
                      <div className="barra" style={{ width: `${(c.productos / maxProductos) * 100}%` }} />
                      <span>{c.productos}</span>
                    </div>
                  </td>
                  <td className="num">{formatoPrecio(c.precioPromedio)}</td>
                  <td className="num">{formatoPrecio(c.precioMinimo)}</td>
                  <td className="num">{formatoPrecio(c.precioMaximo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <h2>Top 5 más agregados a favoritos</h2>
          {masFavoritos.length === 0 ? (
            <Vacio titulo="Sin datos todavía">Cuando los usuarios guarden favoritos aparecerán aquí.</Vacio>
          ) : (
            <ol className="ranking">
              {masFavoritos.map((m) => (
                <li key={m.id}>
                  <div className="ranking-texto">
                    <strong>{m.nombre}</strong>
                    <small>{m.categoria} · {formatoPrecio(m.precio)}</small>
                  </div>
                  <div className="barra-celda ranking-barra">
                    <div className="barra barra-acento" style={{ width: `${(m.veces / maxVeces) * 100}%` }} />
                    <span>{m.veces}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
