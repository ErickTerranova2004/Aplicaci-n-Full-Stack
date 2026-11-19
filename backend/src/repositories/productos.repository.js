// Acceso a datos de productos (CRUD en MongoDB).
const Producto = require('../models/Producto');
const Favorito = require('../models/Favorito');
const { enTransaccion } = require('../config/db');

// Escapa caracteres especiales para usar el texto del usuario dentro de una expresión regular
// (evita que alguien envíe un patrón malicioso o inválido).
const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function listar({ categoria, buscar } = {}) {
  const filtro = {};
  if (categoria) filtro.categoria = categoria.toLowerCase();
  if (buscar) {
    const patron = new RegExp(escaparRegex(buscar), 'i');
    filtro.$or = [{ nombre: patron }, { descripcion: patron }];
  }
  const productos = await Producto.find(filtro).sort({ creado_en: 1, _id: 1 });
  return productos.map((p) => p.toJSON());
}

async function listarCategorias() {
  const categorias = await Producto.distinct('categoria');
  return categorias.sort();
}

async function buscarPorId(id) {
  const producto = await Producto.findById(id);
  return producto ? producto.toJSON() : null;
}

async function crear({ nombre, descripcion, categoria, precio }) {
  const producto = await Producto.create({ nombre, descripcion, categoria, precio });
  return producto.toJSON();
}

// Reemplazo completo. Devuelve null si el producto no existe.
async function actualizar(id, { nombre, descripcion, categoria, precio }) {
  const producto = await Producto.findByIdAndUpdate(
    id,
    { nombre, descripcion, categoria, precio },
    { returnDocument: 'after', runValidators: true }
  );
  return producto ? producto.toJSON() : null;
}

/**
 * Eliminación TRANSACCIONAL: en una sola transacción se borra el producto
 * y todos los favoritos que lo referencian. Si algo falla, no se borra nada
 * (equivalente al ON DELETE CASCADE de una base relacional).
 * Devuelve null si el producto no existe.
 */
async function eliminar(id) {
  return enTransaccion(async (session) => {
    const { deletedCount } = await Producto.deleteOne({ _id: id }, { session });
    if (deletedCount === 0) return null;
    const favoritos = await Favorito.deleteMany({ producto: id }, { session });
    return { favoritosEliminados: favoritos.deletedCount };
  });
}

module.exports = { listar, listarCategorias, buscarPorId, crear, actualizar, eliminar };
