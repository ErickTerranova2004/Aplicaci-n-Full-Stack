const { Router } = require('express');
const reportes = require('../controllers/reportes.controller');
const { verificarToken, requiereRol } = require('../middlewares/auth');

const router = Router();

// Reportería: requiere token (401) y rol admin (403).
router.use(verificarToken, requiereRol('admin'));

router.get('/resumen', reportes.resumen);
router.get('/productos.csv', reportes.productosCsv);

module.exports = router;
