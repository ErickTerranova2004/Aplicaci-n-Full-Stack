# Catálogo de productos con favoritos — Full Stack (React + Node.js + Express + MongoDB + JWT)

Aplicación web **Full Stack** que gestiona un catálogo de productos y la lista de favoritos de cada usuario, con **registro e inicio de sesión mediante JWT**, contraseñas cifradas con **bcrypt** y autorización por **roles** (`usuario` y `admin`).

- **Front-End:** React 19 + Vite + React Router (`frontend/`)
- **Back-End:** Node.js + Express 5 (`backend/`)
- **Base de datos:** MongoDB con Mongoose (local o MongoDB Atlas)
- **Despliegue:** MongoDB Atlas + Render (API y sitio estático) — ver [DEPLOY.md](DEPLOY.md)

> Práctica 4 · Desarrollo Web · Unidad 4: Prueba, revisión y lanzamiento (CRUD transaccional y Deploy Front-End y Back-End).

## Integrantes

| Integrante | Usuario GitHub | Aportes principales |
|---|---|---|
| Aaron Alejandro Bayas Caicedo | _@usuario_ | _Completar_ |
| Jostin Fernando Chalán Mora | _@usuario_ | _Completar_ |
| Erick Steven Terranova Vega | [@ErickTerranova2004](https://github.com/ErickTerranova2004) | _Completar_ |
| Fernando Javier Zavala Cataña | _@usuario_ | _Completar_ |
| Marlon Rainier Aguiño Salinas | _@usuario_ | _Completar_ |

Periodo académico: agosto 2026 a diciembre 2026.

## Funcionalidades

| Módulo | Qué hace | Acceso |
|---|---|---|
| Catálogo | Listar productos, filtrar por categoría y buscar por texto | Público |
| Registro | Crear cuenta (siempre con rol `usuario`), validaciones en cliente y servidor | Público |
| Inicio de sesión | Genera un JWT (HS256, vence en 1 h); el Front-End lo guarda y lo envía como `Authorization: Bearer` | Público |
| Perfil | `GET /api/auth/perfil` valida el token al recargar la página | Autenticado |
| Mis favoritos | Agregar/quitar con el corazón, listar con total; cada usuario ve solo los suyos | Autenticado |
| Gestión de productos | CRUD completo (crear, editar, eliminar con confirmación) | Admin |
| Reportes | Totales, productos por categoría (promedio, mínimo, máximo), top 5 más favoritos y exportación CSV | Admin |
| Acceso no autorizado | Sin sesión → redirige a login; usuario sin rol admin → página 403; token vencido o alterado → cierra la sesión y avisa | — |

### Mejoras respecto a la versión anterior (API con PostgreSQL)

1. **Migración a MongoDB** con Mongoose: colecciones `usuarios`, `productos` y `favoritos`, con índice único de correo y de favorito (usuario + producto).
2. **CRUD transaccional**: al eliminar un producto, el producto y todos sus favoritos se borran en **una transacción ACID** (`session.withTransaction`); agregar un favorito comprueba el producto e inserta en la misma transacción. Si algo falla, se revierte todo.
3. **Front-End React** completo que consume la API REST.
4. **Ruta protegida nueva** `GET /api/auth/perfil` y **reportería** (`/api/reportes/resumen` y `/api/reportes/productos.csv`) con agregaciones de MongoDB.
5. Búsqueda por texto y listado de categorías en el catálogo.
6. Seguridad: **CORS** restringido al Front-End, cabeceras **Helmet**.
7. **Pruebas automatizadas** (`npm test`) con MongoDB en memoria + colección Postman ampliada a 66 peticiones / 136 aserciones.
8. **Despliegue** preparado: `render.yaml` (Blueprint), `vercel.json`, `docker-compose.yml` y guía [DEPLOY.md](DEPLOY.md).

## Arquitectura

```
React (Vite)  ──fetch + JWT──►  Express (rutas → middlewares → controladores → repositorios)  ──Mongoose──►  MongoDB
 frontend/                        backend/                                                                   Atlas / local
```

```
backend/
  src/
    config/        env.js (variables) y db.js (conexión y transacciones)
    models/        Usuario, Producto, Favorito (esquemas Mongoose)
    routes/        auth, productos, favoritos, reportes
    middlewares/   auth.js (verificarToken, requiereRol) y errorHandler.js
    controllers/   lógica de cada endpoint
    repositories/  acceso a datos (consultas y agregaciones)
    validators/    validación de cuerpos y parámetros
  scripts/         initDb.js (índices + datos de ejemplo), crearAdmin.js
  test/            pruebas automatizadas (node:test + supertest)
  postman/         colección y entorno de ejemplo
frontend/
  src/
    api/cliente.js         cliente HTTP (agrega el token, maneja errores y 401)
    context/AuthContext    estado de sesión (login, registro, logout)
    components/            Navbar, RutaProtegida, ProductoCard, UI
    pages/                 Catalogo, Login, Registro, Favoritos, AdminProductos, Reportes, NoAutorizado
```

### Modelo de datos (MongoDB)

| Colección | Campos | Reglas |
|---|---|---|
| `usuarios` | `nombre`, `correo`, `passwordHash`, `rol`, `creado_en` | correo único y en minúsculas; `passwordHash` con `select:false` (nunca se devuelve); rol `usuario` o `admin` |
| `productos` | `nombre`, `descripcion`, `categoria`, `precio`, `creado_en`, `actualizado_en` | precio > 0; categoría en minúsculas e indexada |
| `favoritos` | `usuario` (ref), `producto` (ref), `agregado_en` | índice único `{usuario, producto}`: sin duplicados |

## Requisitos

- Node.js 18 o superior (probado con Node 22)
- MongoDB 6+ — **opción A:** [MongoDB Atlas](https://www.mongodb.com/atlas) (gratis, recomendado); **opción B:** local con `docker compose up -d`; **opción C:** MongoDB Community instalado
- Las transacciones requieren *replica set*. Atlas y el `docker-compose.yml` ya lo son. Con un MongoDB local independiente la API funciona igual, pero sin transacciones (lo avisa en la consola).

## Instalación y ejecución local

```bash
git clone https://github.com/ErickTerranova2004/Aplicaci-n-Full-Stack.git
cd Aplicaci-n-Full-Stack

# 1) Back-End
cd backend
npm ci
cp .env.example .env          # Windows: copy .env.example .env  -> edita MONGODB_URI, JWT_SECRET y ADMIN_*
npm run db:init               # crea índices y carga 7 productos de ejemplo
npm run admin:crear           # crea el administrador con ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev                   # API en http://localhost:3000/api

# 2) Front-End (otra terminal)
cd frontend
npm ci
cp .env.example .env          # VITE_API_URL=http://localhost:3000/api
npm run dev                   # http://localhost:5173
```

Genera un `JWT_SECRET` seguro con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Variables de entorno

| Dónde | Variable | Descripción |
|---|---|---|
| backend | `MONGODB_URI` | Conexión a MongoDB (local o Atlas) |
| backend | `JWT_SECRET` | Secreto para firmar tokens (mín. 32 caracteres) |
| backend | `JWT_EXPIRES_IN` | Vigencia del token (`1h`) |
| backend | `BCRYPT_ROUNDS` | Costo del hash (`10`) |
| backend | `CORS_ORIGIN` | URL(s) del Front-End permitidas, separadas por coma |
| backend | `ADMIN_NOMBRE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Administrador inicial |
| frontend | `VITE_API_URL` | URL base de la API (`.../api`) |

## Endpoints de la API

Prefijo `/api`. Las rutas protegidas requieren `Authorization: Bearer <token>`.

| Método | Ruta | Acceso | Respuesta |
|---|---|---|---|
| POST | `/auth/registro` | Público | `201` usuario (409 correo duplicado, 422 datos inválidos) |
| POST | `/auth/login` | Público | `200` `{ token, tipo, expiraEn, usuario }` (401 credenciales) |
| GET | `/auth/perfil` | Autenticado | `200` usuario del token (401 sin token / vencido / alterado) |
| GET | `/productos?categoria=x&buscar=y` | Público | `200` `{ total, productos }` |
| GET | `/productos/categorias` | Público | `200` `{ categorias }` |
| GET | `/productos/:id` | Público | `200` (400 id mal formado, 404) |
| POST | `/productos` | Admin | `201` (401, 403, 422) |
| PUT | `/productos/:id` | Admin | `200` (401, 403, 404, 422) |
| DELETE | `/productos/:id` | Admin | `204` — **transacción**: borra producto + favoritos |
| GET | `/favoritos` | Autenticado | `200` `{ total, favoritos }` |
| POST | `/favoritos` | Autenticado | `201` — **transacción** (404 producto inexistente, 409 duplicado) |
| DELETE | `/favoritos/:productoId` | Autenticado | `204` (404 si no está en tus favoritos) |
| GET | `/reportes/resumen` | Admin | `200` totales, por categoría, top 5 favoritos |
| GET | `/reportes/productos.csv` | Admin | archivo CSV |

Formato de respuesta: éxito `{ "ok": true, "data": {...} }`; error `{ "ok": false, "error": { "codigo", "mensaje", "detalles?" } }`. Los errores nunca exponen trazas ni secretos.

## Seguridad aplicada

- Contraseñas con **bcrypt**; el hash nunca sale de la base de datos.
- JWT firmado con **HS256** y verificado fijando el algoritmo (rechaza `alg: none`); vencimiento de 1 h.
- El **rol se lee de la base de datos** en cada petición protegida; el registro público nunca crea administradores.
- La identidad en favoritos sale **del token**, nunca del cuerpo de la petición (un `usuarioId` enviado se ignora).
- Login con mensaje genérico y tiempo constante (no revela qué correos existen).
- CORS limitado al Front-End, Helmet, límite de 10 kB en el cuerpo, búsquedas con regex escapada.
- En el Front-End, las rutas protegidas son solo experiencia de usuario: **la seguridad real está en la API**.

## Pruebas

```bash
cd backend
npm test                     # 11 pruebas automatizadas (auth, CRUD, transacciones con rollback, reportes)
```

`npm test` levanta un MongoDB en memoria como replica set (descarga el binario la primera vez), así que no necesita base de datos ni `.env`.

**Postman / Newman** — [`backend/postman/catalogo.postman_collection.json`](backend/postman/catalogo.postman_collection.json): 66 peticiones y 136 aserciones en 10 carpetas (autenticación, catálogo, CRUD, validaciones, 401/403, favoritos, aislamiento A/B, consistencia al eliminar, mejoras/reportes, persistencia).

```bash
cp postman/catalogo.postman_environment.example.json postman/local.postman_environment.json
# completa admin_password y jwt_secret (iguales a tu .env)
npm run test:postman         # con la API encendida
# reinicia la API y luego:
npm run test:persistencia
```

## Despliegue

Resumen (detalle paso a paso en [DEPLOY.md](DEPLOY.md)):

1. **MongoDB Atlas**: cluster M0 gratis, usuario de BD, acceso de red y cadena `mongodb+srv://...`.
2. **Render → New → Blueprint** con este repositorio: crea `catalogo-favoritos-api` (Node) y `catalogo-favoritos-web` (estático) a partir de `render.yaml`.
3. Configura `MONGODB_URI`, `CORS_ORIGIN`, `ADMIN_*` en la API y `VITE_API_URL` en el Front-End.
4. Ejecuta `npm run db:init` y `npm run admin:crear` (Shell de Render o localmente apuntando a Atlas).

| Recurso | URL |
|---|---|
| Front-End | _completar tras el deploy_ |
| API | _completar tras el deploy_ |
| Video demostrativo | _completar con el enlace de Google Drive_ |

## Recursos y herramientas de apoyo

- Documentación oficial de [React](https://react.dev/), [Vite](https://vite.dev/), [React Router](https://reactrouter.com/), [Express 5](https://expressjs.com/), [Mongoose](https://mongoosejs.com/), [MongoDB transacciones](https://www.mongodb.com/docs/manual/core/transactions/), [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken), [bcryptjs](https://github.com/dcodeIO/bcrypt.js), [Render](https://render.com/docs).
- Se utilizó un asistente de IA (Claude) como apoyo para la migración a MongoDB, el Front-End y la documentación; el código fue revisado y probado por el grupo.
