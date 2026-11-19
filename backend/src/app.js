// Configuración de Express (sin arrancar el servidor, para poder reutilizarla en las pruebas).
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { corsOrigins } = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const favoritosRoutes = require('./routes/favoritos.routes');
const reportesRoutes = require('./routes/reportes.routes');
const { rutaNoEncontrada, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.disable('x-powered-by');           // no revelar la tecnología del servidor
app.set('trust proxy', 1);             // en Render/Railway la API está detrás de un proxy HTTPS
app.use(helmet());                     // cabeceras HTTP de seguridad

// CORS: solo el Front-End autorizado (CORS_ORIGIN) puede llamar a la API desde el navegador.
// Las peticiones sin origen (Postman, Newman, curl) se permiten.
app.use(cors({
  origin(origen, callback) {
    if (!origen || corsOrigins.includes('*') || corsOrigins.includes(origen)) return callback(null, true);
    return callback(new Error('Origen no permitido por CORS'));
  },
  exposedHeaders: ['Content-Disposition', 'Location'],
}));

app.use(express.json({ limit: '10kb' })); // parsear JSON y limitar tamaño del cuerpo

app.get('/api/salud', (req, res) => res.json({ ok: true, data: { estado: 'activo', baseDatos: 'MongoDB' } }));

// Express 5 captura automáticamente los errores de las funciones async
// y los envía a errorHandler, por eso los controladores no necesitan try/catch genéricos.
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/favoritos', favoritosRoutes);
app.use('/api/reportes', reportesRoutes);

app.use(rutaNoEncontrada);
app.use(errorHandler);

module.exports = app;
