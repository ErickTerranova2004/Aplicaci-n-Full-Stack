// Controlador del catálogo: recibe la petición, valida, llama al repositorio y responde.
const productosRepo = require('../repositories/productos.repository');
const { validarProducto } = require('../validators/producto.validator');
const { parsearId } = require('../validators/comunes');
const ApiError = require('../utils/ApiError');
const { enviar } = require('../utils/respuesta');

// Lee un filtro opcional de la query string. Si viene, no puede estar vacío.
function leerFiltro(valor, nombre, maximo) {
  if (valor === undefined) return undefined;
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw ApiError.badRequest(`El filtro '${nombre}' no puede estar vacío`);
  }
  if (valor.trim().length > maximo) throw ApiError.badRequest(`El filtro '${nombre}' es demasiado largo`);
  return valor.trim();
}

// GET /api/productos?categoria=tecnologia&buscar=laptop  (público)
async function listar(req, res) {
  const categoria = leerFiltro(req.query.categoria, 'categoria', 60);
  const buscar = leerFiltro(req.query.buscar, 'buscar', 100);
  const productos = await productosRepo.listar({ categoria, buscar });
  enviar(res, 200, { total: productos.length, productos });
}

// GET /api/productos/categorias  (público) -> lista de categorías existentes
async function categorias(req, res) {
  enviar(res, 200, { categorias: await productosRepo.listarCategorias() });
}

// GET /api/productos/:id  (público)
async function obtener(req, res) {
  const id = parsearId(req.params.id);
  const producto = await productosRepo.buscarPorId(id);
  if (!producto) throw ApiError.noEncontrado(`No existe un producto con id ${id}`);
  enviar(res, 200, { producto });
}

// POST /api/productos  (solo admin)
async function crear(req, res) {
  const datos = validarProducto(req.body);
  const producto = await productosRepo.crear(datos);
  res.location(`/api/productos/${producto.id}`);
  enviar(res, 201, { producto });
}

// PUT /api/productos/:id  (solo admin)
async function actualizar(req, res) {
  const id = parsearId(req.params.id);
  const datos = validarProducto(req.body);
  const producto = await productosRepo.actualizar(id, datos);
  if (!producto) throw ApiError.noEncontrado(`No existe un producto con id ${id}`);
  enviar(res, 200, { producto });
}

// DELETE /api/productos/:id  (solo admin)
// Se eliminan el producto y sus favoritos en UNA transacción de MongoDB.
async function eliminar(req, res) {
  const id = parsearId(req.params.id);
  const resultado = await productosRepo.eliminar(id);
  if (!resultado) throw ApiError.noEncontrado(`No existe un producto con id ${id}`);
  res.status(204).end();
}

module.exports = { listar, categorias, obtener, crear, actualizar, eliminar };
