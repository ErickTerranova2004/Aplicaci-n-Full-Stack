// Componentes pequeños reutilizables.
import { useEffect } from 'react';

export const formatoPrecio = (n) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n);

export function Alerta({ tipo = 'error', children, onCerrar }) {
  if (!children) return null;
  return (
    <div className={`alerta alerta-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <span>{children}</span>
      {onCerrar && <button type="button" className="alerta-cerrar" onClick={onCerrar} aria-label="Cerrar">×</button>}
    </div>
  );
}

// Mensaje flotante que desaparece solo.
export function Toast({ mensaje, onFin }) {
  useEffect(() => {
    if (!mensaje) return undefined;
    const t = setTimeout(onFin, 2800);
    return () => clearTimeout(t);
  }, [mensaje, onFin]);
  if (!mensaje) return null;
  return <div className="toast" role="status">{mensaje}</div>;
}

// Ventana de confirmación (en lugar de window.confirm).
export function Confirmar({ abierto, titulo, children, textoAceptar = 'Eliminar', onAceptar, onCancelar, procesando }) {
  if (!abierto) return null;
  return (
    <div className="modal-fondo" role="presentation" onClick={onCancelar}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" onClick={(e) => e.stopPropagation()}>
        <h3 id="modal-titulo">{titulo}</h3>
        <div className="modal-cuerpo">{children}</div>
        <div className="modal-acciones">
          <button type="button" className="btn btn-fantasma" onClick={onCancelar} disabled={procesando}>Cancelar</button>
          <button type="button" className="btn btn-peligro" onClick={onAceptar} disabled={procesando}>
            {procesando ? 'Procesando…' : textoAceptar}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Campo({ etiqueta, error, children, id }) {
  return (
    <div className={`campo ${error ? 'campo-error' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {error && <small className="campo-mensaje">{error}</small>}
    </div>
  );
}

export function Vacio({ titulo, children }) {
  return (
    <div className="vacio">
      <div className="vacio-icono" aria-hidden="true">♡</div>
      <h3>{titulo}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}
