const ApiError = require('../utils/ApiError');
const { exigirCuerpo, esObjectId } = require('./comunes');

// Solo se acepta productoId. Si el cliente envía "usuarioId", se IGNORA:
// el usuario siempre se toma del token verificado.
function validarFavorito(body) {
  exigirCuerpo(body);
  const { productoId } = body;
  if (!esObjectId(productoId)) {
    throw ApiError.validacion([{ campo: 'productoId', mensaje: 'productoId es obligatorio y debe ser un identificador válido (24 caracteres hexadecimales)' }]);
  }
  return { productoId: productoId.toLowerCase() };
}

module.exports = { validarFavorito };
