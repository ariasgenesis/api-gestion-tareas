# API de gestión de tareas

API REST construida con Node.js, Express 5, TypeScript y PostgreSQL. Incluye
registro, login con JWT y operaciones de tareas con aislamiento por usuario.

## Requisitos y configuración

- Node.js 20 o posterior y npm.
- PostgreSQL con una base de datos y el rol `task_app` configurados.
- Copia `.env.example` a `.env` y completa las credenciales de tu entorno.
- Genera una clave de firma local aleatoria de al menos 32 bytes para
  `JWT_SECRET`. En PowerShell puedes generarla con:

  ```powershell
  [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
  ```

  Guarda el resultado solo en `.env`; no lo compartas ni lo subas al repositorio.
- `CORS_ORIGINS` admite una lista separada por comas de orígenes completos,
  por ejemplo `http://localhost:5173`. No incluyas rutas.
- `TRUST_PROXY_HOPS` debe permanecer en `0` salvo que exista un proxy inverso
  confiable delante de la API. En ese caso configura el número real de saltos.

Instala dependencias y prepara PostgreSQL:

```powershell
npm install
psql -U <usuario_admin> -d <base_de_datos> -f src/persistence/schema.sql
```

El archivo SQL es el esquema inicial y se ejecuta una sola vez en una base
nueva, con el rol `task_app` creado previamente. No lo vuelvas a ejecutar sobre
una base que ya tenga las tablas. El proyecto aún no incluye un ejecutor de
migraciones versionadas; antes de cambiar el esquema en etapas posteriores,
conviene incorporar uno.

## Comandos

```powershell
npm run dev       # servidor en modo desarrollo
npm run typecheck # comprobación TypeScript
npm test          # pruebas de integración contra PostgreSQL
npm run build     # genera dist/
npm start         # inicia la versión compilada
```

Las pruebas de integración crean usuarios y tareas con correos aleatorios y
los eliminan al terminar. Ejecútalas contra una base de pruebas, nunca contra
producción. Requieren `DB_*` y `JWT_SECRET` válidos en `.env`.

## Endpoints

Los errores y mensajes para el consumidor están en español. Los cuerpos y las
respuestas usan JSON.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/health` | Público | Estado de la API |
| `POST` | `/auth/register` | Público | Registra un usuario |
| `POST` | `/auth/login` | Público, limitado | Valida credenciales y devuelve JWT |
| `GET` | `/tasks` | Bearer JWT | Lista las tareas propias |
| `POST` | `/tasks` | Bearer JWT | Crea una tarea propia |
| `GET` | `/tasks/:id` | Bearer JWT | Obtiene una tarea propia |
| `PATCH` | `/tasks/:id` | Bearer JWT | Actualiza campos de una tarea propia |
| `DELETE` | `/tasks/:id` | Bearer JWT | Elimina una tarea propia |

### Registro y login

`POST /auth/register` recibe `{ "nombre": "Ana", "correo": "ana@example.com", "contrasena": "ClaveSegura123" }`.

`POST /auth/login` recibe `{ "correo": "ana@example.com", "contrasena": "ClaveSegura123" }`.
La respuesta de login incluye `token`, `tipo_token: "Bearer"`, `expira_en: 900`
y los datos públicos del usuario. El token dura 15 minutos.

Usa el token en las rutas privadas:

```http
Authorization: Bearer <token>
```

Credenciales incorrectas o token inválido devuelven `401`; datos inválidos,
`400`; recurso inexistente o propiedad de otro usuario, `404`.

### Tareas

Un cuerpo de creación puede incluir:

```json
{
  "titulo": "Preparar entrevista",
  "descripcion": "Repasar diseño de APIs",
  "fecha_vencimiento": "2027-01-15T18:00:00Z",
  "estado": "pendiente"
}
```

`titulo` es obligatorio. `descripcion` y `fecha_vencimiento` pueden omitirse o
ser `null`; la fecha, si tiene valor, debe estar en ISO 8601 con zona horaria.
Los estados permitidos son `pendiente`, `en curso` y `completada`. En `PATCH`
se envían solo los campos que se quieren cambiar; asignar `null` limpia la
descripción o la fecha. El usuario no se especifica en el cuerpo: el servidor
lo toma del `sub` del JWT. Todas las lecturas y modificaciones filtran por el
ID autenticado.

## Seguridad y despliegue

- Las contraseñas se almacenan con bcrypt; nunca se devuelven en respuestas.
- Los JWT usan `HS256`, incluyen el ID en `sub` y expiran en 15 minutos.
- El endpoint de login limita a 10 intentos por IP cada 15 minutos. El limitador
  usa memoria local; en despliegues con varias instancias, configura un store
  compartido para que el límite sea consistente.
- CORS permite solo los orígenes indicados en `CORS_ORIGINS`.
- `helmet` establece encabezados HTTP de seguridad y el parser JSON limita el
  cuerpo a 64 KB.
- En producción sirve la API únicamente detrás de HTTPS, terminado en un proxy
  o balanceador con certificado válido. La aplicación rechaza solicitudes
  HTTP de producción con `426` (excepto `/health` para verificadores internos).
  Configura `TRUST_PROXY_HOPS` al número real de proxies para que Express pueda
  reconocer HTTPS reenviado y no expongas directamente una instancia HTTP pública.
- No hay refresh tokens ni endpoint de logout. El cliente debe descartar el
  token al cerrar sesión; la expiración limita su vigencia.
