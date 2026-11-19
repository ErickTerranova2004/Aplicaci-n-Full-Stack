import { formatoPrecio } from './Ui';

export default function ProductoCard({ producto, esFavorito, onAlternarFavorito, procesando }) {
  return (
    <article className="tarjeta">
      <div className={`tarjeta-banda banda-${producto.categoria}`}>
        <span className="etiqueta-categoria">{producto.categoria}</span>
        <button
          type="button"
          className={`btn-corazon ${esFavorito ? 'activo' : ''}`}
          onClick={() => onAlternarFavorito(producto)}
          disabled={procesando}
          aria-pressed={esFavorito}
          aria-label={esFavorito ? `Quitar ${producto.nombre} de favoritos` : `Agregar ${producto.nombre} a favoritos`}
          title={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          {esFavorito ? '♥' : '♡'}
        </button>
      </div>
      <div className="tarjeta-cuerpo">
        <h3>{producto.nombre}</h3>
        <p>{producto.descripcion}</p>
      </div>
      <div className="tarjeta-pie">
        <strong className="precio">{formatoPrecio(producto.precio)}</strong>
      </div>
    </article>
  );
}
