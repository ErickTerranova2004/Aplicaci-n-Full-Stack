const ApiError = require('../utils/ApiError');

const esTextoNoVacio = (v) => typeof v === 'string' && v.trim().length > 0;

// En MongoDB los identificadores son ObjectId: 24 caracteres hexadecimales.
const REGEX_OBJECT_ID = /^[a-f\d]{24}$/i;
const esObjectId = (v) => typeof v === 'string' && REGEX_OBJECT_ID.test(v);

// Valida un identificador que llega en la URL (/productos/:id).
// Un id mal formado ("abc", "-3", "123") es una petición mal construida -> 400.
function parsearId(valor, nombre = 'id') {
  if (!esObjectId(String(valor))) {
    throw ApiError.badRequest(`El parámetro '${nombre}' debe ser un identificador válido (24 caracteres hexadecimales)`);
  }
  return String(valor).toLowerCase();
}

// Verifica que el cuerpo sea un objeto JSON (no un arreglo ni vacío).
function exigirCuerpo(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw ApiError.badRequest('El cuerpo de la petición debe ser un objeto JSON');
  }
}

module.exports = { esTextoNoVacio, esObjectId, parsearId, exigirCuerpo };
