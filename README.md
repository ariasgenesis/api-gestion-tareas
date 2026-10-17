# API de gestión de tareas

API REST para registrar usuarios, iniciar sesión con JWT y administrar tareas personales. Está construida con Node.js, Express 5, TypeScript y PostgreSQL, con una arquitectura por capas (`src/api`, `src/controllers`, `src/services` y `src/persistence`). Todas las operaciones sobre tareas se limitan al usuario identificado por el token autenticado.

## 1. Requisitos previos

- Node.js 20 o posterior y npm.
- PostgreSQL en ejecución y el cliente `psql` disponible en la terminal.
- Una cuenta administradora de PostgreSQL solo para crear la base, el rol de aplicación y ejecutar el esquema inicial. La API no debe conectarse como `postgres` ni como superusuario.
- PowerShell para los comandos de esta guía. En otras terminales, adapta la sintaxis de copia de `.env.example` y de las variables de entorno.

Comprueba las instalaciones:

```powershell
node --version
npm --version
psql --version
```

## 2. Recursos y dependencias del proyecto

`npm install` instala las dependencias registradas en `package.json` y fijadas por `package-lock.json`.

### Dependencias de ejecución

| Paquete | Versión declarada | Uso |
|---|---:|---|
| `express` | `^5.3.0` | Servidor HTTP, rutas y middleware. |
| `pg` | `^8.23.1` | Pool de conexiones y consultas a PostgreSQL. |
| `dotenv` | `^18.0.8` | Carga las variables definidas en `.env`. |
| `zod` | `^4.6.7` | Validación de cuerpos y entradas de la API. |
| `bcryptjs` | `^3.0.3` | Hash y verificación de contraseñas. |
| `jsonwebtoken` | `^9.0.3` | Firma y verificación de tokens JWT. |
| `cors` | `^2.8.6` | Control de orígenes permitidos para clientes web. |
| `helmet` | `^8.3.0` | Encabezados HTTP de seguridad. |
| `express-rate-limit` | `^8.7.1` | Límite de intentos al iniciar sesión. |
| `swagger-ui-express` | `^5.0.1` | Publica la especificación OpenAPI mediante Swagger UI. |

### Dependencias de desarrollo y tipos

| Paquete | Versión declarada | Uso |
|---|---:|---|
| `typescript` | `^7.0.2` | Compilador y comprobación estática de TypeScript. |
| `tsx` | `^4.23.15` | Ejecuta TypeScript y recarga el servidor durante desarrollo; también ejecuta las pruebas. |
| `@types/node` | `^26.6.5` | Tipos de Node.js. |
| `@types/express` | `^5.0.6` | Tipos de Express 5. |
| `@types/pg` | `^8.23.1` | Tipos de PostgreSQL para TypeScript. |
| `@types/jsonwebtoken` | `^9.0.10` | Tipos de JWT para TypeScript. |
| `@types/cors` | `^2.8.19` | Tipos de CORS para TypeScript. |
| `@types/swagger-ui-express` | `^4.1.8` | Tipos de Swagger UI para TypeScript. |

PostgreSQL es un servicio externo al proyecto y debe instalarse/configurarse por separado; `pg` es el cliente Node.js, no el servidor de base de datos.

## 3. Instalación paso a paso

### 3.1. Instalar paquetes

Desde la raíz del repositorio:

```powershell
npm install
```

### 3.2. Crear el rol de aplicación

Conéctate como administrador a PostgreSQL y crea un usuario exclusivo para la API. Reemplaza el marcador por una contraseña segura; no uses la contraseña de `postgres` y no guardes esta contraseña en el repositorio.

```powershell
psql -U postgres -d postgres
```

En el prompt de `psql` ejecuta:

```sql
CREATE ROLE task_app
    LOGIN
    PASSWORD 'REEMPLAZA_POR_UNA_CONTRASENA_SEGURA'
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE;
CREATE DATABASE task_manager_db;
\q
```

El rol `task_app` se usa para la conexión de la API. El administrador se usa solo durante la configuración inicial.

### 3.3. Crear tablas e índices

Ejecuta el esquema inicial una sola vez en una base nueva. El archivo crea las tablas `usuarios` y `tareas`, índices y restricciones, y concede al rol `task_app` permisos de uso del esquema, lectura e inserción/actualización/borrado de datos y uso de secuencias. Ejecútalo como el administrador que creó la base:

```powershell
psql -U postgres -d task_manager_db -f src/persistence/schema.sql
```

No ejecutes de nuevo este archivo sobre una base que ya tenga esas tablas. El proyecto aún no incluye un ejecutor de migraciones versionadas. Para cambios posteriores del esquema, prepara migraciones antes de actualizar una base existente.

### 3.4. Configurar variables de entorno

Crea `.env` en la raíz copiando la plantilla:

```powershell
Copy-Item .env.example .env
```

Edita `.env` y configura todos los valores:

```dotenv
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_manager_db
DB_USER=task_app
DB_PASSWORD=LA_MISMA_CONTRASENA_DEL_ROL_TASK_APP
DB_SSL=false
JWT_SECRET=CLAVE_ALEATORIA_DE_AL_MENOS_32_BYTES
CORS_ORIGINS=http://localhost:5173
TRUST_PROXY_HOPS=0
```

Genera un secreto JWT aleatorio desde PowerShell y pega el resultado en `JWT_SECRET`:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

La variable debe contener al menos 32 bytes en UTF-8. Conserva `.env` en tu máquina: está excluido de Git. No copies el secreto en registros, respuestas, capturas ni archivos versionados. En despliegue, entrega los secretos mediante el gestor de secretos de la plataforma.

#### Variables disponibles

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PORT` | No | Puerto HTTP; predeterminado `3000`, rango `1–65535`. |
| `DB_HOST` | Sí | Host de PostgreSQL. |
| `DB_PORT` | No | Puerto PostgreSQL; predeterminado `5432`, rango `1–65535`. |
| `DB_NAME` | Sí | Nombre de la base. |
| `DB_USER` | Sí | Rol de aplicación; para este proyecto, `task_app`. |
| `DB_PASSWORD` | Sí | Contraseña de ese rol. |
| `DB_SSL` | No | `true` o `false`; predeterminado `false`. Si está activo, se valida el certificado TLS del servidor. |
| `JWT_SECRET` | Sí | Secreto de firma JWT de al menos 32 bytes. |
| `CORS_ORIGINS` | En producción | Orígenes web completos separados por comas, sin rutas; normaliza una barra final, por ejemplo `https://frontend.example/`. En desarrollo predeterminado: `http://localhost:5173`. |
| `TRUST_PROXY_HOPS` | No | Saltos de proxy confiables, entero de `0` a `10`; predeterminado `0`. |

`src/config/env.ts` valida y convierte estas variables durante la carga de la aplicación. Si falta una variable requerida o un valor no cumple el formato o rango permitido, el inicio falla con un error que identifica la configuración inválida.

## 4. Ejecutar la API

En desarrollo, con PostgreSQL activo y `.env` configurado:

```powershell
npm run dev
```

El servidor comprueba la conexión con PostgreSQL antes de abrir el puerto. De forma predeterminada estará en `http://localhost:3000`. Comprueba su disponibilidad en otra terminal:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Para detener el servidor, usa `Ctrl+C`; el proceso cierra el listener y el pool de PostgreSQL de forma ordenada.

### Comandos disponibles

```powershell
npm run dev       # desarrollo con recarga automática
npm run typecheck # comprobación TypeScript sin emitir archivos
npm test          # pruebas de integración contra PostgreSQL
npm run build     # compila src/ en dist/
npm start         # inicia dist/server.js
```

Las pruebas de integración crean usuarios y tareas temporales y los borran al terminar. Configura las variables de `.env` para una base de pruebas aislada; no ejecutes `npm test` contra producción. Para iniciar la compilación:

```powershell
npm run build
npm start
```

## 5. Endpoints

Todos los cuerpos y respuestas son JSON. Los errores siguen el formato centralizado del API.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/` | Público | Información básica de la API. |
| `GET` | `/health` | Público | Disponibilidad de la API. |
| `GET` | `/docs` | Público | Interfaz interactiva de Swagger UI. |
| `GET` | `/docs/openapi.json` | Público | Especificación OpenAPI en JSON. |
| `POST` | `/auth/register` | Público | Registra un usuario. |
| `POST` | `/auth/login` | Público, limitado | Autentica y emite JWT. |
| `GET` | `/tasks` | Bearer JWT | Lista las tareas propias. |
| `POST` | `/tasks` | Bearer JWT | Crea una tarea propia. |
| `GET` | `/tasks/:id` | Bearer JWT | Obtiene una tarea propia. |
| `PATCH` | `/tasks/:id` | Bearer JWT | Actualiza parcialmente una tarea propia. |
| `DELETE` | `/tasks/:id` | Bearer JWT | Elimina una tarea propia. |

### 5.1. Registrar usuario

Solicitud a `POST /auth/register`:

```json
{
  "nombre": "Ana Pérez",
  "correo": "ana@example.com",
  "contrasena": "ClaveSegura123"
}
```

Ejemplo en PowerShell:

```powershell
$body = @{
  nombre = 'Ana Pérez'
  correo = 'ana@example.com'
  contrasena = 'ClaveSegura123'
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3000/auth/register' `
  -Method Post -ContentType 'application/json' -Body $body
```

La respuesta incluye los datos públicos del usuario. La contraseña se almacena como hash bcrypt y el hash nunca se devuelve.

### 5.2. Iniciar sesión y obtener JWT

Solicitud a `POST /auth/login`:

```json
{
  "correo": "ana@example.com",
  "contrasena": "ClaveSegura123"
}
```

Ejemplo en PowerShell para guardar el token devuelto:

```powershell
$body = @{
  correo = 'ana@example.com'
  contrasena = 'ClaveSegura123'
} | ConvertTo-Json

$sesion = Invoke-RestMethod -Uri 'http://localhost:3000/auth/login' `
  -Method Post -ContentType 'application/json' -Body $body
$token = $sesion.token
```

La respuesta incluye `token`, `tipo_token: "Bearer"`, `expira_en: 900` y el usuario público. El JWT está firmado con `HS256`, lleva el ID del usuario en el claim `sub` y expira en 15 minutos. Las rutas privadas esperan el encabezado:

```http
Authorization: Bearer <token>
```

Ejemplo de petición autenticada:

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/tasks' `
  -Headers @{ Authorization = "Bearer $token" }
```

### 5.3. Crear una tarea

`POST /tasks` requiere JWT. Ejemplo:

```powershell
$body = @{
  titulo = 'Preparar entrevista'
  descripcion = 'Repasar diseño de APIs'
  fecha_vencimiento = '2027-01-15T18:00:00Z'
  estado = 'pendiente'
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3000/tasks' `
  -Method Post -Headers @{ Authorization = "Bearer $token" } `
  -ContentType 'application/json' -Body $body
```

`titulo` es obligatorio. `descripcion` y `fecha_vencimiento` se pueden omitir o enviar como `null`; la fecha, cuando tenga valor, debe ser ISO 8601 con zona horaria. Los estados permitidos son `pendiente`, `en curso` y `completada`. El servidor determina la propiedad con el usuario del JWT; no envíes `usuario_id` para asignar la tarea.

### 5.4. Consultar, actualizar y eliminar tareas

- `GET /tasks` lista todas las tareas propias.
- `GET /tasks/:id` consulta una tarea propia.
- `PATCH /tasks/:id` recibe solo los campos a modificar. Enviar `null` limpia `descripcion` o `fecha_vencimiento`.
- `DELETE /tasks/:id` elimina una tarea propia.

Ejemplo de actualización parcial:

```powershell
$body = @{ estado = 'completada' } | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/tasks/$id" `
  -Method Patch -Headers @{ Authorization = "Bearer $token" } `
  -ContentType 'application/json' -Body $body
```

Todas las consultas de tareas filtran por el ID autenticado en el servidor. La API ignora cualquier intento de seleccionar otro propietario y responde como recurso inexistente (`404`) si la tarea no existe o pertenece a otra cuenta.

## 6. Autenticación, errores y seguridad

- Registro y login están disponibles sin token; el resto de `/tasks` requiere un JWT válido en `Authorization: Bearer ...`.
- Credenciales incorrectas y token ausente, inválido o expirado se rechazan con `401`. Los datos inválidos se responden con `400`. Las rutas no existentes responden con `404`.
- El login permite 10 intentos por IP cada 15 minutos. El limitador usa memoria local; si se ejecutan varias instancias, configura un store compartido para aplicar el límite globalmente.
- CORS solo permite los orígenes especificados en `CORS_ORIGINS`. En producción la variable es obligatoria.
- Helmet configura encabezados HTTP de seguridad y el parser JSON limita cada cuerpo a 64 KB.
- Configura TLS/HTTPS en un proxy inverso o balanceador con certificado válido. En producción, la API rechaza HTTP con `426`, salvo `/health` para verificadores internos. Si hay proxies de confianza, asigna a `TRUST_PROXY_HOPS` el número real de saltos y evita exponer directamente una instancia HTTP pública.
- No hay refresh token ni endpoint de logout. El cliente debe descartar el token al cerrar sesión; la expiración limita su vigencia.
- No subas `.env`, claves JWT, contraseñas ni credenciales a Git.

## 7. Arquitectura del código

- `src/api`: definición y montaje de rutas.
- `src/controllers`: traducción de solicitudes/respuestas HTTP.
- `src/services`: reglas de negocio, validaciones y autenticación.
- `src/persistence`: pool PostgreSQL, repositorios y esquema SQL.
- `src/middleware`: autenticación, manejo centralizado de errores y controles HTTP.
- `src/docs/openapi.ts`: contrato OpenAPI de rutas, autenticación, cuerpos y respuestas.
- `src/api/docs.routes.ts`: Swagger UI en `/docs` y especificación en `/docs/openapi.json`.
- `src/config/env.ts`: carga y validación de configuración; falla al inicio si faltan variables requeridas o sus valores son inválidos.
- `src/app.ts`: configura y exporta Express sin abrir un puerto.
- `src/server.ts`: comprueba PostgreSQL, inicia HTTP y gestiona el apagado.
- `tests/api.integration.test.ts`: pruebas de integración de la API.

Los controladores, el middleware JWT, la emisión/verificación de tokens y las
consultas de tareas con filtro por propietario incluyen JSDoc en los puntos
de contrato y seguridad más relevantes.
