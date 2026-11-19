// Cliente HTTP para consumir la API REST.
// - Agrega automáticamente el encabezado Authorization: Bearer <token>.
// - Convierte las respuestas de error de la API en un ErrorApi con estado, código y detalles.
// - Si la API responde 401 a una petición que llevaba token, avisa que la sesión expiró.

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const CLAVE_TOKEN = 'catalogo_token';

export const almacenToken = {
  leer: () => { try { return localStorage.getItem(CLAVE_TOKEN); } catch { return null; } },
  guardar: (t) => { try { localStorage.setItem(CLAVE_TOKEN, t); } catch { /* sin almacenamiento */ } },
  borrar: () => { try { localStorage.removeItem(CLAVE_TOKEN); } catch { /* sin almacenamiento */ } },
};

export class ErrorApi extends Error {
  constructor(status, codigo, mensaje, detalles = []) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }

  // Convierte [{campo, mensaje}] en { campo: mensaje } para mostrar errores junto a cada input.
  get erroresPorCampo() {
    return Object.fromEntries((this.detalles || []).filter((d) => d.campo).map((d) => [d.campo, d.mensaje]));
  }
}

export const EVENTO_SESION_EXPIRADA = 'catalogo:sesion-expirada';

export async function api(ruta, { metodo = 'GET', cuerpo, comoBlob = false } = {}) {
  const token = almacenToken.leer();
  const headers = {};
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi(0, 'SIN_CONEXION', 'No se pudo conectar con el servidor. Verifica que la API esté encendida.');
  }

  if (respuesta.status === 204) return null;

  if (respuesta.ok && comoBlob) return respuesta.blob();

  const json = await respuesta.json().catch(() => null);
  if (respuesta.ok && json?.ok) return json.data;

  const error = json?.error || {};
  if (respuesta.status === 401 && token) {
    window.dispatchEvent(new CustomEvent(EVENTO_SESION_EXPIRADA, { detail: error.mensaje }));
  }
  throw new ErrorApi(
    respuesta.status,
    error.codigo || 'ERROR',
    error.mensaje || `Error ${respuesta.status}`,
    error.detalles
  );
}

// Funciones por recurso (así los componentes no escriben URLs a mano).
export const authApi = {
  registro: (datos) => api('/auth/registro', { metodo: 'POST', cuerpo: datos }),
  login: (datos) => api('/auth/login', { metodo: 'POST', cuerpo: datos }),
  perfil: () => api('/auth/perfil'),
};

export const productosApi = {
  listar: ({ categoria, buscar } = {}) => {
    const q = new URLSearchParams();
    if (categoria) q.set('categoria', categoria);
    if (buscar) q.set('buscar', buscar);
    return api(`/productos${q.size ? `?${q}` : ''}`);
  },
  categorias: () => api('/productos/categorias'),
  crear: (datos) => api('/productos', { metodo: 'POST', cuerpo: datos }),
  actualizar: (id, datos) => api(`/productos/${id}`, { metodo: 'PUT', cuerpo: datos }),
  eliminar: (id) => api(`/productos/${id}`, { metodo: 'DELETE' }),
};

export const favoritosApi = {
  listar: () => api('/favoritos'),
  agregar: (productoId) => api('/favoritos', { metodo: 'POST', cuerpo: { productoId } }),
  quitar: (productoId) => api(`/favoritos/${productoId}`, { metodo: 'DELETE' }),
};

export const reportesApi = {
  resumen: () => api('/reportes/resumen'),
  csv: () => api('/reportes/productos.csv', { comoBlob: true }),
};
