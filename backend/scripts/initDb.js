// Prepara la base de datos MongoDB: crea las colecciones con sus índices
// y carga productos de ejemplo (solo si el catálogo está vacío).
// Uso: npm run db:init
// Con --reset borra TODAS las colecciones antes (¡pierde todos los datos!): npm run db:reset
const { mongodbUri } = require('../src/config/env');
const { conectar, desconectar } = require('../src/config/db');
const Usuario = require('../src/models/Usuario');
const Producto = require('../src/models/Producto');
const Favorito = require('../src/models/Favorito');
const productosEjemplo = require('./productosEjemplo');

async function main() {
  const reset = process.argv.includes('--reset');
  try {
    const conexion = await conectar(mongodbUri);
    if (reset) {
      await Promise.all([Favorito.deleteMany({}), Producto.deleteMany({}), Usuario.deleteMany({})]);
      console.log('Colecciones vaciadas (reset).');
    }
    // createCollection es idempotente en Mongoose: crea la colección si no existe.
    await Promise.all([Usuario.createCollection(), Producto.createCollection(), Favorito.createCollection()]);
    await Promise.all([Usuario.syncIndexes(), Producto.syncIndexes(), Favorito.syncIndexes()]);

    if ((await Producto.countDocuments()) === 0) {
      await Producto.insertMany(productosEjemplo);
      console.log(`Se cargaron ${productosEjemplo.length} productos de ejemplo.`);
    }
    console.log(`Base de datos "${conexion.name}" lista. Productos en el catálogo: ${await Producto.countDocuments()}`);
  } catch (err) {
    console.error('Error inicializando la base de datos:', err.message);
    process.exitCode = 1;
  } finally {
    await desconectar();
  }
}

main();
