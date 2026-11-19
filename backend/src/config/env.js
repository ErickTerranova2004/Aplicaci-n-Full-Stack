// Carga y valida las variables de entorno una sola vez.
// Si falta una variable obligatoria, la aplicación no arranca (falla rápido y claro).
require('dotenv').config({ quiet: true });

const obligatorias = ['MONGODB_URI', 'JWT_SECRET'];
const faltantes = obligatorias.filter((nombre) => !process.env[nombre]);

if (faltantes.length > 0) {
  console.error(`Faltan variables de entorno: ${faltantes.join(', ')}. Revisa tu archivo .env`);
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET debe tener al menos 32 caracteres.');
  process.exit(1);
}

// Orígenes del Front-End autorizados por CORS, separados por coma.
// Ej.: http://localhost:5173,https://catalogo-favoritos.onrender.com
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

module.exports = {
  port: Number(process.env.PORT) || 3000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  corsOrigins,
};
