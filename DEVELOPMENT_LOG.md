
# Bitácora de Desarrollo

## 1. Información general

- **Proyecto:** Sistema de Gestión de Tareas
- **Tecnologías:** Node.js, Express, TypeScript y PostgreSQL
- **Objetivo:** Desarrollar una API REST para la gestión de usuarios y tareas personales.
- **Herramientas de IA utilizadas:** Codex y otras herramientas, si corresponde.

## 2. Registro de desarrollo

### 2.1. Registro de usuarios

**Fecha:** 2026-10-17

**Objetivo:**
Implementar la persistencia y `POST /auth/register` en las capas ya previstas
por el proyecto. No se implementaron login, JWT ni operaciones de tareas.

Este registro describe las decisiones aplicadas por Codex y queda sujeto a la
revisión del desarrollador.

**Herramienta utilizada:**
Codex (GPT-6).

**Prompt utilizado:**
Solicitud de implementar el registro de usuarios conforme a la arquitectura
existente, validar los datos, cifrar contraseñas, gestionar duplicados y
verificar el endpoint y PostgreSQL.

**Qué se aceptó y por qué:**
Se añadieron `zod` para validar la entrada y `bcryptjs` para almacenar hashes
bcrypt con coste 12. Se reutiliza el pool de `pg`, el índice único existente
`usuarios_correo_unico` sobre `LOWER(correo)` y la estructura por rutas,
controladores, servicios y persistencia. El nombre debe venir ya recortado; el
correo se recorta y normaliza a minúsculas. La respuesta solo incluye campos
públicos.

**Qué se rechazó o modificó:**
No se modificó `schema.sql` porque el esquema ya aporta las columnas y la
unicidad requeridas. No se agregaron login, JWT ni CRUD. Se añadió un límite de
72 bytes a la contraseña para evitar que bcrypt procese silenciosamente solo
un prefijo. Se mantuvo sin cambios el trabajo local preexistente ajeno a esta
funcionalidad.

**Verificación realizada:**
`npx tsc --noEmit` terminó correctamente. Con PostgreSQL local activo, la API
devolvió HTTP 201 para el registro válido, HTTP 409 para el duplicado y HTTP
400 para nombre faltante, correo inválido y contraseña corta. La respuesta del
registro no incluyó `hash_contrasena`. Una consulta a PostgreSQL confirmó que
la contraseña de prueba se guardó como hash bcrypt y que `bcrypt.compare`
verificó la contraseña. No se agregó una suite automatizada; las verificaciones
se ejecutaron contra la API y la base configurada.

### 2.2. Inicio de sesión y JWT

**Fecha:** 2026-10-17

**Objetivo:**
Agregar `POST /auth/login` y tokens de acceso verificables, manteniendo las
capas y el manejo de errores existentes.

**Herramienta utilizada:**
Codex (GPT-6).

**Cambios aplicados:**
Se añadió `jsonwebtoken` con sus tipos de TypeScript. La búsqueda de usuario
ahora recupera los datos públicos y el hash necesarios para autenticar; el
controlador solo devuelve datos públicos. El correo comparte el mismo esquema
de normalización entre registro y login. Las credenciales inválidas usan el
mismo error HTTP 401. El JWT firma únicamente `sub` con `HS256`, expira en 15
minutos y se verifica permitiendo explícitamente ese algoritmo. La
configuración exige `JWT_SECRET` con al menos 32 bytes y `.env.example` contiene
la variable vacía como marcador, sin un secreto de ejemplo.

**Problemas del estado anterior y correcciones:**
El repositorio solo consultaba si el correo existía, lo cual no permitía
comparar la contraseña. Además, `src/config/config.ts` tenía un secreto JWT por
defecto. Se amplió la consulta para la autenticación y se reemplazó esa
configuración duplicada por alias de la configuración activa, sin fallback
inseguro.

**Verificación realizada:**
`npx tsc --noEmit` terminó correctamente. La validación local aceptó correo con
espacios y mayúsculas tras normalizarlo y rechazó contraseña faltante. Se
comprobó que al faltar `JWT_SECRET` la aplicación falla indicando el nombre de
la variable requerida. Después de que el desarrollador configuró la clave, el
registro temporal respondió HTTP 201 y el login correcto HTTP 200; la respuesta
no incluyó hash, informó Bearer y una expiración de 900 segundos. Contraseña
incorrecta y correo inexistente devolvieron HTTP 401 con el mismo mensaje;
correo y contraseña faltantes devolvieron HTTP 400. La función de verificación
aceptó el token de prueba, rechazó una firma modificada y rechazó un token
expirado. El usuario creado para estas comprobaciones se eliminó al terminar.
En esa etapa aún no existía el middleware de autenticación; su implementación
y prueba se registran en la siguiente etapa.

### 2.3. Rutas protegidas y CRUD de tareas

**Fecha:** 2026-10-17

**Objetivo:**
Proteger las operaciones de tareas con JWT, limitar el acceso a recursos del
usuario autenticado y completar las comprobaciones automatizadas del API.

**Cambios aplicados:**
Se añadieron middleware Bearer JWT y endpoints `GET/POST /tasks` y
`GET/PATCH/DELETE /tasks/:id`. El controlador toma el ID únicamente de los
claims verificados; el repositorio filtra lecturas, actualizaciones y borrados
por `usuario_id`, y crea tareas con ese ID. Se añadieron validaciones de
entrada, errores centralizados para JSON mal formado, payload demasiado grande
y rutas inexistentes, rate limit de login, CORS por orígenes permitidos y
encabezados de seguridad con Helmet. En producción, HTTP se rechaza salvo
para `/health`, destinado a verificadores internos.

**Verificación realizada:**
`npm run typecheck`, `npm run build` y `npm test` terminaron correctamente. La
prueba de integración cubre credenciales y token, acceso sin autenticación,
aislamiento de tareas entre usuarios (incluyendo creación con `usuario_id`
ajeno en el cuerpo), CRUD, validación, JSON mal formado, 404, CORS, encabezados
de seguridad, rate limit y rechazo de HTTP en modo producción. Se ejecutó
contra PostgreSQL local y elimina los datos de prueba al terminar. No se
modificó el esquema porque ya contiene la tabla e índices requeridos.

---

## 3. Decisiones independientes

### Decisión 1: Normalización del correo

**Decisión:**
Recortar espacios externos y convertir el correo a minúsculas antes de
consultarlo e insertarlo.

**Justificación:**
El esquema ya aplica unicidad sin distinguir mayúsculas/minúsculas mediante
`LOWER(correo)`, por lo que la normalización hace coherentes la consulta previa,
la persistencia y la respuesta.

---

## 4. Retos y soluciones

### Reto 1: Verificación del entorno

**Problema:**
La ejecución en el entorno aislado no podía conectarse a PostgreSQL local.

**Solución:**
La comprobación se repitió con acceso al PostgreSQL local ya configurado.

**Resultado:**
La conexión se estableció y las verificaciones de registro descritas arriba
terminaron con los estados esperados.

---

## 5. Observaciones finales

Pendiente: añadir pruebas automatizadas y middleware de autenticación cuando se
implementen rutas protegidas. No se hicieron commits ni push.
