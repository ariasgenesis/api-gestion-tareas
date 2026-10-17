export class AppError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
        public readonly details?: unknown,
    ) {
        super(message);
        this.name = new.target.name;
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 400, details);
    }
}

export class EmailAlreadyExistsError extends AppError {
    constructor() {
        super('El correo ya está registrado.', 409);
    }
}

export class InvalidCredentialsError extends AppError {
    constructor() {
        super('El correo o la contraseña son incorrectos.', 401);
    }
}

export class InvalidAccessTokenError extends AppError {
    constructor() {
        super('El token no es válido o ha expirado.', 401);
    }
}

export class AuthenticationRequiredError extends AppError {
    constructor() {
        super('Debes autenticarte para acceder a este recurso.', 401);
    }
}

export class ResourceNotFoundError extends AppError {
    constructor(message = 'El recurso solicitado no existe.') {
        super(message, 404);
    }
}

export class PayloadTooLargeError extends AppError {
    constructor() {
        super('El cuerpo de la solicitud supera el tamaño permitido.', 413);
    }
}
