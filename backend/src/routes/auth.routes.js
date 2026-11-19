const { Router } = require('express');
const auth = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/auth');

const router = Router();

router.post('/registro', auth.registro); // Público
router.post('/login', auth.login);       // Público
router.get('/perfil', verificarToken, auth.perfil); // Protegida (JWT)

module.exports = router;
