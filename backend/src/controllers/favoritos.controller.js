// Controlador de favoritos. La identidad SIEMPRE sale de req.usuario (token verificado),
// nunca de req.body ni de la URL. Así cada usuario solo opera sobre sus propios favoritos.
const favoritosRepo = require('../repositories/favoritos.repository');
const { validarFavorito } = require('../validators/favorito.validator');
const { parsearId } = require('../validators/comunes');
const ApiError = require('../utils/ApiError');
const { enviar } = require('../utils/respuesta');

// GET /api/favoritos  (autenticado)
async function listar(req, res) {
  const favoritos = await favoritosRepo.listarPorUsuario(req.usuario.id);
  enviar(res, 200, { total: favoritos.length, favoritos });
}

// POST /api/favoritos  body: { "productoId": 3 }  (autenticado)
async function agregar(req, res) {
  const { productoId } = validarFavorito(req.body);
  try {
    const favorito = await favoritosRepo.agregar(req.usuario.id, productoId);
    enviar(res, 201, { favorito });
  } catch (err) {
    // El índice único de MongoDB impide duplicados; aquí se traduce a un mensaje claro (409).
    if (err.code === 11000) throw ApiError.conflicto('El producto ya está en tus favoritos');
    throw err;
  }
}

// DELETE /api/favoritos/:productoId  (autenticado)
async function quitar(req, res) {
  const productoId = parsearId(req.params.productoId, 'productoId');
  const eliminado = await favoritosRepo.eliminar(req.usuario.id, productoId);
  // Si el favorito es de OTRO usuario, aquí no se encuentra -> 404 (no se revela que existe).
  if (!eliminado) throw ApiError.noEncontrado('Ese producto no está en tus favoritos');
  res.status(204).end();
}

module.exports = { listar, agregar, quitar };
