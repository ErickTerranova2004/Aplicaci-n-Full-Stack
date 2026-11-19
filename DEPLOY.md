# Guía de despliegue (Deploy Front-End y Back-End)

## 1. Selección del hosting

| Capa | Servicio elegido | Por qué | Alternativas |
|---|---|---|---|
| Base de datos | **MongoDB Atlas** (M0 gratis) | MongoDB administrado, ya es *replica set* (permite transacciones), copias y monitoreo | MongoDB en Railway |
| Back-End (API) | **Render** – Web Service Node | Despliegue directo desde GitHub, HTTPS automático, variables de entorno, plan gratuito | Railway, Fly.io |
| Front-End (React) | **Render** – Static Site | Sirve el `dist/` de Vite por CDN; mismo panel que la API | Vercel, Netlify (incluidos `vercel.json` y `public/_redirects`) |

> En el plan gratuito de Render la API se "duerme" tras 15 min sin uso; la primera petición puede tardar ~1 minuto.

## 2. MongoDB Atlas

1. Crear cuenta en <https://www.mongodb.com/atlas> → **Create** → cluster **M0 (Free)**.
2. **Database Access** → *Add New Database User* (usuario y contraseña; rol *Read and write to any database*).
3. **Network Access** → *Add IP Address* → `0.0.0.0/0` (Render usa IPs dinámicas).
4. **Connect → Drivers** → copiar la cadena y agregar el nombre de la base:
   `mongodb+srv://USUARIO:CLAVE@cluster0.xxxxx.mongodb.net/catalogo_db?retryWrites=true&w=majority`

## 3. Back-End en Render

**Opción Blueprint (recomendada):** Render → **New → Blueprint** → conectar el repositorio. Render lee `render.yaml` y crea los dos servicios. Completar las variables que pide:

| Variable | Valor |
|---|---|
| `MONGODB_URI` | cadena de Atlas |
| `CORS_ORIGIN` | URL del Front-End, p. ej. `https://catalogo-favoritos-web.onrender.com` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | credenciales del administrador |

`JWT_SECRET` se genera automáticamente.

**Opción manual:** New → Web Service → Root Directory `backend`, Build `npm ci --omit=dev`, Start `npm start`, Health check `/api/salud`, y las mismas variables.

Inicializar datos (una vez): en el servicio → **Shell**:

```bash
npm run db:init
npm run admin:crear
```

(o desde tu computador, con `MONGODB_URI` de Atlas en tu `.env` local).

Comprobar: `https://<tu-api>.onrender.com/api/salud` → `{"ok":true,...}`.

## 4. Front-End en Render (o Vercel)

- **Render Static Site** (creado por el Blueprint): Root `frontend`, Build `npm ci && npm run build`, Publish `dist`, variable `VITE_API_URL=https://<tu-api>.onrender.com/api`, regla *Rewrite* `/*` → `/index.html` (ya en `render.yaml`).
- **Vercel**: Import Project → Root Directory `frontend` → Framework *Vite* → variable `VITE_API_URL`. El `vercel.json` ya redirige las rutas de React.

> `VITE_API_URL` se inyecta **al compilar**: si la cambias, vuelve a desplegar el Front-End.

## 5. Verificación posterior al deploy

- [ ] `/api/salud` responde 200.
- [ ] El catálogo carga desde la URL pública del Front-End (sin errores CORS en la consola).
- [ ] Registro, login y "Mis favoritos" funcionan; recargar la página mantiene la sesión.
- [ ] Un usuario normal ve "403 Acceso no autorizado" en `/admin/productos`.
- [ ] El admin puede crear, editar y eliminar productos y ver reportes.
- [ ] Newman contra producción: cambiar `base_url` del entorno a `https://<tu-api>.onrender.com/api` y ejecutar `npm run test:postman`.
