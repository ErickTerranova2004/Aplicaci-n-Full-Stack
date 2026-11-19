// Pruebas automatizadas de la API (node:test + supertest).
// Levantan un MongoDB en memoria configurado como replica set, para poder probar transacciones.
// Ejecutar con: npm test   (no necesita un MongoDB instalado ni archivo .env)
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'secreto_solo_para_pruebas_automatizadas_1234567890';
let replSet;
let request;
let app;
let db;
let modelos;

const correo = (n) => `${n}.${Date.now()}@prueba.local`;

before(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  process.env.MONGODB_URI = replSet.getUri('catalogo_test');
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.BCRYPT_ROUNDS = '4';

  request = require('supertest');
  db = require('../src/config/db');
  modelos = {
    Usuario: require('../src/models/Usuario'),
    Producto: require('../src/models/Producto'),
    Favorito: require('../src/models/Favorito'),
  };
  app = require('../src/app');
  await db.conectar(process.env.MONGODB_URI);
});

after(async () => {
  await db.desconectar();
  await replSet.stop();
});

// Crea un administrador directamente en la BD (como hace npm run admin:crear) y devuelve su token.
async function tokenAdmin() {
  const email = correo('admin');
  await modelos.Usuario.create({
    nombre: 'Admin', correo: email, rol: 'admin', passwordHash: await bcrypt.hash('AdminSeguro1', 4),
  });
  const res = await request(app).post('/api/auth/login').send({ correo: email, password: 'AdminSeguro1' });
  return res.body.data.token;
}

async function registrarYLogin(nombre) {
  const email = correo(nombre);
  await request(app).post('/api/auth/registro').send({ nombre, correo: email, password: 'Clave12345' });
  const res = await request(app).post('/api/auth/login').send({ correo: email, password: 'Clave12345' });
  return { token: res.body.data.token, usuario: res.body.data.usuario };
}

describe('Autenticación con JWT', () => {
  test('registra con contraseña hasheada (bcrypt) y rol usuario aunque envíe rol admin', async () => {
    const email = correo('registro');
    const res = await request(app).post('/api/auth/registro')
      .send({ nombre: 'Ana', correo: email, password: 'Clave12345', rol: 'admin' });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.usuario.rol, 'usuario');
    assert.equal(res.body.data.usuario.passwordHash, undefined);

    const guardado = await modelos.Usuario.findOne({ correo: email }).select('+passwordHash');
    assert.notEqual(guardado.passwordHash, 'Clave12345');
    assert.ok(await bcrypt.compare('Clave12345', guardado.passwordHash));
  });

  test('correo duplicado responde 409', async () => {
    const email = correo('dup');
    await request(app).post('/api/auth/registro').send({ nombre: 'A', correo: email, password: 'Clave12345' });
    const res = await request(app).post('/api/auth/registro').send({ nombre: 'B', correo: email, password: 'Clave12345' });
    assert.equal(res.status, 409);
  });

  test('login válido genera un JWT HS256 con el id del usuario', async () => {
    const { token, usuario } = await registrarYLogin('login');
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    assert.equal(payload.sub, usuario.id);
    assert.equal(payload.rol, 'usuario');
  });

  test('login con contraseña incorrecta responde 401', async () => {
    const email = correo('mal');
    await request(app).post('/api/auth/registro').send({ nombre: 'M', correo: email, password: 'Clave12345' });
    const res = await request(app).post('/api/auth/login').send({ correo: email, password: 'otraClave' });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.codigo, 'CREDENCIALES_INVALIDAS');
  });

  test('ruta protegida /auth/perfil: con token 200, sin token 401, token alterado 401', async () => {
    const { token } = await registrarYLogin('perfil');
    assert.equal((await request(app).get('/api/auth/perfil').set('Authorization', `Bearer ${token}`)).status, 200);
    assert.equal((await request(app).get('/api/auth/perfil')).status, 401);
    const alterado = token.slice(0, -2) + (token.endsWith('aa') ? 'bb' : 'aa');
    assert.equal((await request(app).get('/api/auth/perfil').set('Authorization', `Bearer ${alterado}`)).status, 401);
  });
});

describe('CRUD de productos', () => {
  test('admin crea, consulta, edita y elimina; usuario normal recibe 403', async () => {
    const admin = await tokenAdmin();
    const { token: tokenUsuario } = await registrarYLogin('normal');
    const producto = { nombre: 'Termo', descripcion: 'Termo de acero', categoria: 'Hogar', precio: 12.5 };

    const prohibido = await request(app).post('/api/productos').set('Authorization', `Bearer ${tokenUsuario}`).send(producto);
    assert.equal(prohibido.status, 403);

    const creado = await request(app).post('/api/productos').set('Authorization', `Bearer ${admin}`).send(producto);
    assert.equal(creado.status, 201);
    assert.equal(creado.body.data.producto.categoria, 'hogar');
    const id = creado.body.data.producto.id;

    const consulta = await request(app).get(`/api/productos/${id}`);
    assert.equal(consulta.status, 200);

    const editado = await request(app).put(`/api/productos/${id}`).set('Authorization', `Bearer ${admin}`)
      .send({ ...producto, precio: 15 });
    assert.equal(editado.status, 200);
    assert.equal(editado.body.data.producto.precio, 15);

    const eliminado = await request(app).delete(`/api/productos/${id}`).set('Authorization', `Bearer ${admin}`);
    assert.equal(eliminado.status, 204);
    assert.equal((await request(app).get(`/api/productos/${id}`)).status, 404);
  });

  test('validaciones: precio negativo 422, id mal formado 400', async () => {
    const admin = await tokenAdmin();
    const res = await request(app).post('/api/productos').set('Authorization', `Bearer ${admin}`)
      .send({ nombre: 'X', descripcion: 'Y', categoria: 'z', precio: -1 });
    assert.equal(res.status, 422);
    assert.equal((await request(app).get('/api/productos/123')).status, 400);
  });
});

describe('Transacciones', () => {
  test('eliminar un producto borra sus favoritos en la misma transacción', async () => {
    const admin = await tokenAdmin();
    const a = await registrarYLogin('fav');
    const creado = await request(app).post('/api/productos').set('Authorization', `Bearer ${admin}`)
      .send({ nombre: 'Temporal', descripcion: 'Se eliminará', categoria: 'pruebas', precio: 1 });
    const id = creado.body.data.producto.id;

    const fav = await request(app).post('/api/favoritos').set('Authorization', `Bearer ${a.token}`).send({ productoId: id });
    assert.equal(fav.status, 201);
    assert.equal(await modelos.Favorito.countDocuments({ producto: id }), 1);

    await request(app).delete(`/api/productos/${id}`).set('Authorization', `Bearer ${admin}`);
    assert.equal(await modelos.Favorito.countDocuments({ producto: id }), 0);
  });

  test('si una operación falla dentro de la transacción, se revierte todo (rollback)', async () => {
    const nombre = `Rollback ${Date.now()}`;
    await assert.rejects(db.enTransaccion(async (session) => {
      await modelos.Producto.create([{ nombre, descripcion: 'd', categoria: 'c', precio: 5 }], { session });
      throw new Error('fallo simulado');
    }), /fallo simulado/);
    assert.equal(await modelos.Producto.countDocuments({ nombre }), 0);
  });
});

describe('Reportería', () => {
  test('resumen: admin 200 con totales; usuario 403', async () => {
    const admin = await tokenAdmin();
    const { token } = await registrarYLogin('rep');
    const res = await request(app).get('/api/reportes/resumen').set('Authorization', `Bearer ${admin}`);
    assert.equal(res.status, 200);
    assert.equal(typeof res.body.data.totales.usuarios, 'number');
    assert.ok(Array.isArray(res.body.data.porCategoria));
    assert.equal((await request(app).get('/api/reportes/resumen').set('Authorization', `Bearer ${token}`)).status, 403);
  });

  test('exporta el catálogo a CSV', async () => {
    const admin = await tokenAdmin();
    const res = await request(app).get('/api/reportes/productos.csv').set('Authorization', `Bearer ${admin}`);
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/csv/);
    assert.match(res.text, /id,nombre,categoria,precio,favoritos,creado_en/);
  });
});
