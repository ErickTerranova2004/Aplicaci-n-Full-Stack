// Acceso a datos de favoritos.
// IMPORTANTE: todas las consultas filtran por el usuario, que siempre viene del token.
// Así un usuario nunca puede leer ni borrar favoritos de otro.
const Favorito = require('../models/Favorito');
const Producto = require('../models/Producto');
const { enTransaccion } = require('../config/db');
const ApiError = require('../utils/ApiError');

async function listarPorUsuario(usuarioId) {
  const favoritos = await Favorito.find({ usuario: usuarioId })
    .sort({ agregado_en: -1, _id: -1 })
    .populate('producto');
  return favoritos
    .filter((f) => f.producto) // por seguridad: ignora referencias a productos inexistentes
    .map((f) => ({ ...f.producto.toJSON(), agregado_en: f.agregado_en }));
}

/**
 * Agregar es TRANSACCIONAL: se comprueba que el producto exista y se inserta el favorito
 * dentro de la misma transacción, así un admin no puede borrar el producto "en medio".
 * - Producto inexistente -> 404
 * - Duplicado (índice único usuario+producto) -> error 11000, que el controlador traduce a 409
 */
async function agregar(usuarioId, productoId) {
  return enTransaccion(async (session) => {
    const existe = await Producto.exists({ _id: productoId }).session(session);
    if (!existe) throw ApiError.noEncontrado(`No existe un producto con id ${productoId}`);
    const [favorito] = await Favorito.create([{ usuario: usuarioId, producto: productoId }], { session });
    return {
      usuario_id: String(favorito.usuario),
      producto_id: String(favorito.producto),
      agregado_en: favorito.agregado_en,
    };
  });
}

// Solo borra si el favorito pertenece a ESE usuario.
async function eliminar(usuarioId, productoId) {
  const { deletedCount } = await Favorito.deleteOne({ usuario: usuarioId, producto: productoId });
  return deletedCount > 0;
}

module.exports = { listarPorUsuario, agregar, eliminar };
