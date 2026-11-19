// Crea (o actualiza) el usuario administrador a partir de variables de entorno.
// Es la ÚNICA forma de obtener el rol admin: el registro público siempre crea 'usuario'.
// Uso: npm run admin:crear
const bcrypt = require('bcryptjs');
const { mongodbUri, bcryptRounds } = require('../src/config/env');
const { conectar, desconectar } = require('../src/config/db');
const Usuario = require('../src/models/Usuario');

async function main() {
  const nombre = process.env.ADMIN_NOMBRE || 'Administrador';
  const correo = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!correo || password.length < 8) {
    console.error('Define ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 8 caracteres) en tu archivo .env');
    process.exitCode = 1;
    return;
  }

  try {
    await conectar(mongodbUri);
    const passwordHash = await bcrypt.hash(password, bcryptRounds);
    // upsert: si el correo ya existe, se promueve a admin y se actualiza la contraseña.
    const admin = await Usuario.findOneAndUpdate(
      { correo },
      { nombre, correo, passwordHash, rol: 'admin' },
      { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
    );
    const { id, rol } = admin.toJSON();
    console.log('Administrador listo:', { id, nombre, correo, rol });
  } catch (err) {
    console.error('No se pudo crear el administrador:', err.message);
    process.exitCode = 1;
  } finally {
    await desconectar();
  }
}

main();
