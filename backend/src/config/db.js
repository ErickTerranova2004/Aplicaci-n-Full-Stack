// Conexión a MongoDB con Mongoose y utilidad para ejecutar transacciones.
const mongoose = require('mongoose');

// Solo se guardan en la BD los campos definidos en los esquemas (lo demás se descarta).
mongoose.set('strictQuery', true);

async function conectar(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  // Crea los índices únicos (correo, favorito usuario+producto) si aún no existen.
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  return mongoose.connection;
}

async function desconectar() {
  await mongoose.disconnect();
}

// Se recuerda si el servidor admite transacciones (requiere replica set; Atlas sí lo es).
let transaccionesDisponibles = true;

function esErrorSinReplicaSet(err) {
  if (!err) return false;
  const original = err.originalError || {};
  return err.code === 20 || original.code === 20
    || /replica set|Transaction numbers|retryable writes/i.test(err.message || '');
}

/**
 * Ejecuta "trabajo(session)" dentro de una transacción ACID de MongoDB:
 * o se aplican TODAS las operaciones o ninguna.
 * Si el servidor es un MongoDB local independiente (sin replica set), las transacciones
 * no existen; en ese caso se ejecuta el mismo trabajo sin sesión y se avisa una vez en consola.
 */
async function enTransaccion(trabajo) {
  if (transaccionesDisponibles) {
    const session = await mongoose.startSession();
    try {
      let resultado;
      await session.withTransaction(async () => {
        resultado = await trabajo(session);
      });
      return resultado;
    } catch (err) {
      if (!esErrorSinReplicaSet(err)) throw err;
      transaccionesDisponibles = false;
      console.warn('[MongoDB] El servidor no admite transacciones (no es replica set). Se continúa sin ellas.');
    } finally {
      await session.endSession();
    }
  }
  return trabajo(null);
}

module.exports = { conectar, desconectar, enTransaccion, mongoose };
