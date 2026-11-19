// Acceso a datos de usuarios (MongoDB). Sin lógica HTTP.
const Usuario = require('../models/Usuario');
const { esObjectId } = require('../validators/comunes');

async function crear({ nombre, correo, passwordHash }) {
  // El rol se fija en 'usuario' aquí, nunca viene del cliente.
  const usuario = await Usuario.create({ nombre, correo, passwordHash, rol: 'usuario' });
  return usuario.toJSON();
}

// Para el login sí se necesita el hash (para comparar), pero nunca se envía al cliente.
async function buscarPorCorreoConHash(correo) {
  const usuario = await Usuario.findOne({ correo }).select('+passwordHash');
  if (!usuario) return null;
  return { ...usuario.toJSON(), passwordHash: usuario.passwordHash };
}

async function buscarPorId(id) {
  if (!esObjectId(id)) return null;
  const usuario = await Usuario.findById(id);
  return usuario ? usuario.toJSON() : null;
}

module.exports = { crear, buscarPorCorreoConHash, buscarPorId };
