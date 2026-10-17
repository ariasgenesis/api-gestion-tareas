/** Contrato OpenAPI 3.0 publicado por Swagger UI en `/docs`. */
export const openApiDocument = {
    openapi: '3.0.3',
    info: {
        title: 'API de gestión de tareas',
        version: '1.0.0',
        description:
            'API de usuarios y tareas personales. Las operaciones de tareas requieren JWT y siempre se limitan al usuario autenticado.',
    },
    servers: [{ url: '/', description: 'Servidor actual' }],
    tags: [
        { name: 'Salud', description: 'Disponibilidad del servicio' },
        { name: 'Autenticación', description: 'Registro e inicio de sesión' },
        { name: 'Tareas', description: 'CRUD de tareas propias' },
    ],
    paths: {
        '/': {
            get: {
                tags: ['Salud'],
                summary: 'Información básica de la API',
                responses: {
                    '200': {
                        description: 'API disponible',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/MessageResponse' },
                                example: { mensaje: 'API de Gestión de Tareas funcionando correctamente.' },
                            },
                        },
                    },
                },
            },
        },
        '/health': {
            get: {
                tags: ['Salud'],
                summary: 'Comprobar disponibilidad de la API',
                responses: {
                    '200': {
                        description: 'API disponible',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['estado', 'mensaje'],
                                    properties: {
                                        estado: { type: 'string', example: 'correcto' },
                                        mensaje: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/auth/register': {
            post: {
                tags: ['Autenticación'],
                summary: 'Registrar un usuario',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/RegisterRequest' },
                            example: {
                                nombre: 'Ana Pérez',
                                correo: 'ana@example.com',
                                contrasena: 'ClaveSegura123',
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Usuario registrado; no se devuelve el hash de contraseña.',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/RegisterResponse' },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/ValidationError' },
                    '409': {
                        description: 'El correo ya está registrado.',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
                    },
                    '500': { $ref: '#/components/responses/InternalError' },
                },
            },
        },
        '/auth/login': {
            post: {
                tags: ['Autenticación'],
                summary: 'Autenticar al usuario y emitir un JWT',
                description: 'El token Bearer firmado con HS256 expira en 15 minutos.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LoginRequest' },
                            example: { correo: 'ana@example.com', contrasena: 'ClaveSegura123' },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Autenticación correcta',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
                    },
                    '400': { $ref: '#/components/responses/ValidationError' },
                    '401': {
                        description: 'Correo o contraseña incorrectos.',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
                    },
                    '429': { description: 'Se superó el límite de intentos de inicio de sesión.' },
                    '500': { $ref: '#/components/responses/InternalError' },
                },
            },
        },
        '/tasks': {
            get: {
                tags: ['Tareas'],
                summary: 'Listar las tareas del usuario autenticado',
                description: 'La propiedad se determina exclusivamente a partir del claim `sub` del JWT.',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'Lista de tareas propias',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['tareas'],
                                    properties: {
                                        tareas: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
                                    },
                                },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '500': { $ref: '#/components/responses/InternalError' },
                },
            },
            post: {
                tags: ['Tareas'],
                summary: 'Crear una tarea para el usuario autenticado',
                description: 'No envíes `usuario_id`; el servidor lo obtiene del JWT.',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateTaskRequest' },
                            example: {
                                titulo: 'Preparar entrevista',
                                descripcion: 'Repasar diseño de APIs',
                                fecha_vencimiento: '2027-01-15T18:00:00Z',
                                estado: 'pendiente',
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Tarea creada',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskMutationResponse' } } },
                    },
                    '400': { $ref: '#/components/responses/ValidationError' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '413': { $ref: '#/components/responses/PayloadTooLarge' },
                    '500': { $ref: '#/components/responses/InternalError' },
                },
            },
        },
        '/tasks/{id}': {
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Identificador numérico de la tarea.',
                    schema: { type: 'string', pattern: '^[1-9]\\d{0,18}$', example: '42' },
                },
            ],
            get: {
                tags: ['Tareas'],
                summary: 'Obtener una tarea propia',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'Tarea encontrada',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['tarea'],
                                    properties: { tarea: { $ref: '#/components/schemas/Task' } },
                                },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/ValidationError' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                    '500': { $ref: '#/components/responses/InternalError' },
                },
            },
            patch: {
                tags: ['Tareas'],
                summary: 'Actualizar parcialmente una tarea propia',
                description: 'Envía al menos un campo. Enviar `null` limpia descripción o fecha de vencimiento.',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UpdateTaskRequest' },
                            example: { estado: 'completada', descripcion: null },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Tarea actualizada',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskMutationResponse' } } },
                    },
                    '400': { $ref: '#/components/responses/ValidationError' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                    '413': { $ref: '#/components/responses/PayloadTooLarge' },
                    '500': { $ref: '#/components/responses/InternalError' },
                },
            },
            delete: {
                tags: ['Tareas'],
                summary: 'Eliminar una tarea propia',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'Tarea eliminada',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/MessageResponse' },
                                example: { mensaje: 'Tarea eliminada correctamente.' },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/ValidationError' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                    '500': { $ref: '#/components/responses/InternalError' },
                },
            },
        },
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Token obtenido mediante `POST /auth/login`.',
            },
        },
        schemas: {
            RegisterRequest: {
                type: 'object',
                required: ['nombre', 'correo', 'contrasena'],
                properties: {
                    nombre: { type: 'string', minLength: 1, maxLength: 100 },
                    correo: { type: 'string', format: 'email', maxLength: 255 },
                    contrasena: { type: 'string', minLength: 8, maxLength: 72, description: 'Máximo 72 bytes UTF-8.' },
                },
            },
            LoginRequest: {
                type: 'object',
                required: ['correo', 'contrasena'],
                properties: {
                    correo: { type: 'string', format: 'email', maxLength: 255 },
                    contrasena: { type: 'string', minLength: 1, maxLength: 72 },
                },
            },
            PublicUser: {
                type: 'object',
                required: ['id', 'nombre', 'correo', 'creado_en'],
                properties: {
                    id: { type: 'string', example: '7' },
                    nombre: { type: 'string', example: 'Ana Pérez' },
                    correo: { type: 'string', format: 'email', example: 'ana@example.com' },
                    creado_en: { type: 'string', format: 'date-time' },
                },
            },
            RegisterResponse: {
                type: 'object',
                required: ['mensaje', 'usuario'],
                properties: {
                    mensaje: { type: 'string' },
                    usuario: { $ref: '#/components/schemas/PublicUser' },
                },
            },
            LoginResponse: {
                type: 'object',
                required: ['mensaje', 'token', 'tipo_token', 'expira_en', 'usuario'],
                properties: {
                    mensaje: { type: 'string' },
                    token: { type: 'string', description: 'JWT firmado con HS256.' },
                    tipo_token: { type: 'string', enum: ['Bearer'] },
                    expira_en: { type: 'integer', example: 900, description: 'Segundos hasta la expiración.' },
                    usuario: { $ref: '#/components/schemas/PublicUser' },
                },
            },
            CreateTaskRequest: {
                type: 'object',
                required: ['titulo'],
                properties: {
                    titulo: { type: 'string', minLength: 1, maxLength: 200 },
                    descripcion: { type: 'string', maxLength: 10000, nullable: true },
                    fecha_vencimiento: { type: 'string', format: 'date-time', nullable: true },
                    estado: { type: 'string', enum: ['pendiente', 'en curso', 'completada'], default: 'pendiente' },
                },
            },
            UpdateTaskRequest: {
                type: 'object',
                minProperties: 1,
                properties: {
                    titulo: { type: 'string', minLength: 1, maxLength: 200 },
                    descripcion: { type: 'string', maxLength: 10000, nullable: true },
                    fecha_vencimiento: { type: 'string', format: 'date-time', nullable: true },
                    estado: { type: 'string', enum: ['pendiente', 'en curso', 'completada'] },
                },
            },
            Task: {
                type: 'object',
                required: ['id', 'titulo', 'descripcion', 'fecha_vencimiento', 'estado', 'creado_en', 'actualizado_en'],
                properties: {
                    id: { type: 'string', example: '42' },
                    titulo: { type: 'string', example: 'Preparar entrevista' },
                    descripcion: { type: 'string', nullable: true, example: 'Repasar diseño de APIs' },
                    fecha_vencimiento: { type: 'string', format: 'date-time', nullable: true },
                    estado: { type: 'string', enum: ['pendiente', 'en curso', 'completada'] },
                    creado_en: { type: 'string', format: 'date-time' },
                    actualizado_en: { type: 'string', format: 'date-time' },
                },
            },
            TaskMutationResponse: {
                type: 'object',
                required: ['mensaje', 'tarea'],
                properties: {
                    mensaje: { type: 'string' },
                    tarea: { $ref: '#/components/schemas/Task' },
                },
            },
            MessageResponse: {
                type: 'object',
                required: ['mensaje'],
                properties: { mensaje: { type: 'string' } },
            },
            ErrorResponse: {
                type: 'object',
                required: ['error'],
                properties: {
                    error: {
                        type: 'object',
                        required: ['mensaje'],
                        properties: {
                            mensaje: { type: 'string' },
                            detalles: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        campo: { type: 'string' },
                                        mensaje: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        responses: {
            ValidationError: {
                description: 'Solicitud inválida.',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            Unauthorized: {
                description: 'Se requiere un JWT válido o las credenciales no son válidas.',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            NotFound: {
                description: 'La tarea no existe o pertenece a otro usuario.',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            PayloadTooLarge: {
                description: 'El cuerpo supera el límite de 64 KB.',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            InternalError: {
                description: 'Error interno no detallado al cliente.',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
        },
    },
} as const;
