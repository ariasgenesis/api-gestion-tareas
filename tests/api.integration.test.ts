import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { test } from 'node:test';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import app from '../src/app';
import { pool } from '../src/persistence/database';
import { verifyAccessToken } from '../src/services/jwt.service';

interface ApiResponse<T = Record<string, unknown>> {
    response: Response;
    body: T;
}

async function request<T = Record<string, unknown>>(
    baseUrl: string,
    path: string,
    options: RequestInit = {},
): Promise<ApiResponse<T>> {
    const response = await fetch(`${baseUrl}${path}`, options);
    const body = (await response.json()) as T;
    return { response, body };
}

function jsonRequest(method: string, body?: unknown, token?: string): RequestInit {
    return {
        method,
        headers: {
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    };
}

test('autenticación y CRUD de tareas respetan el propietario autenticado', async (t) => {
    await pool.query('SELECT 1');

    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const suffix = randomUUID();
    const emailA = `api-test-a-${suffix}@example.test`;
    const emailB = `api-test-b-${suffix}@example.test`;
    const password = 'ClaveSegura123';

    t.after(async () => {
        await pool.query('DELETE FROM usuarios WHERE correo = ANY($1::text[])', [
            [emailA, emailB],
        ]);
        await new Promise<void>((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
        await pool.end();
    });

    const allowedOrigin = await request(baseUrl, '/health', {
        headers: { Origin: 'http://localhost:5173' },
    });
    assert.equal(
        allowedOrigin.response.headers.get('access-control-allow-origin'),
        'http://localhost:5173',
    );
    assert.equal(allowedOrigin.response.headers.get('x-content-type-options'), 'nosniff');

    const disallowedOrigin = await request(baseUrl, '/health', {
        headers: { Origin: 'https://sitio-no-autorizado.example' },
    });
    assert.equal(disallowedOrigin.response.headers.get('access-control-allow-origin'), null);

    const unauthenticated = await request(baseUrl, '/tasks');
    assert.equal(unauthenticated.response.status, 401);

    const invalidToken = await request(
        baseUrl,
        '/tasks',
        jsonRequest('GET', undefined, 'token-invalido'),
    );
    assert.equal(invalidToken.response.status, 401);

    const registerA = await request<{ usuario: { id: string } }>(
        baseUrl,
        '/auth/register',
        jsonRequest('POST', { nombre: 'Usuario A', correo: emailA, contrasena: password }),
    );
    assert.equal(registerA.response.status, 201);

    const registerB = await request<{ usuario: { id: string } }>(
        baseUrl,
        '/auth/register',
        jsonRequest('POST', { nombre: 'Usuario B', correo: emailB, contrasena: password }),
    );
    assert.equal(registerB.response.status, 201);

    const loginA = await request<{
        token: string;
        usuario: { id: string; correo: string };
    }>(
        baseUrl,
        '/auth/login',
        jsonRequest('POST', { correo: emailA.toUpperCase(), contrasena: password }),
    );
    assert.equal(loginA.response.status, 200);
    assert.equal(loginA.body.usuario.correo, emailA);
    assert.equal('hash_contrasena' in loginA.body.usuario, false);

    const claims = verifyAccessToken(loginA.body.token);
    assert.equal(claims.sub, registerA.body.usuario.id);
    assert.equal(claims.exp - claims.iat, 900);
    const invalidSignature = loginA.body.token.replace(/.$/, 'x');
    assert.throws(() => verifyAccessToken(invalidSignature));
    const expiredToken = jwt.sign(
        { sub: registerA.body.usuario.id },
        env.jwt.secret,
        { algorithm: 'HS256', expiresIn: -1 },
    );
    assert.throws(() => verifyAccessToken(expiredToken));

    const loginB = await request<{ token: string }>(
        baseUrl,
        '/auth/login',
        jsonRequest('POST', { correo: emailB, contrasena: password }),
    );
    assert.equal(loginB.response.status, 200);

    const wrongPassword = await request<{ error: { mensaje: string } }>(
        baseUrl,
        '/auth/login',
        jsonRequest('POST', { correo: emailA, contrasena: 'incorrecta' }),
    );
    const missingUser = await request<{ error: { mensaje: string } }>(
        baseUrl,
        '/auth/login',
        jsonRequest('POST', {
            correo: `missing-${suffix}@example.test`,
            contrasena: password,
        }),
    );
    assert.equal(wrongPassword.response.status, 401);
    assert.equal(missingUser.response.status, 401);
    assert.equal(wrongPassword.body.error.mensaje, missingUser.body.error.mensaje);

    const missingCredentials = await request(baseUrl, '/auth/login', jsonRequest('POST', {}));
    assert.equal(missingCredentials.response.status, 400);

    const createA = await request<{ tarea: { id: string; titulo: string } }>(
        baseUrl,
        '/tasks',
        jsonRequest(
            'POST',
            {
                titulo: 'Tarea privada A',
                usuario_id: registerB.body.usuario.id,
                fecha_vencimiento: '2030-12-31T00:00:00Z',
            },
            loginA.body.token,
        ),
    );
    assert.equal(createA.response.status, 201);
    assert.equal(createA.body.tarea.titulo, 'Tarea privada A');

    const createB = await request<{ tarea: { id: string } }>(
        baseUrl,
        '/tasks',
        jsonRequest('POST', { titulo: 'Tarea privada B' }, loginB.body.token),
    );
    assert.equal(createB.response.status, 201);

    const listA = await request<{ tareas: Array<{ id: string }> }>(
        baseUrl,
        '/tasks',
        jsonRequest('GET', undefined, loginA.body.token),
    );
    assert.deepEqual(listA.body.tareas.map((task) => task.id), [createA.body.tarea.id]);

    const crossUserRead = await request(
        baseUrl,
        `/tasks/${createB.body.tarea.id}`,
        jsonRequest('GET', undefined, loginA.body.token),
    );
    assert.equal(crossUserRead.response.status, 404);

    const crossUserUpdate = await request(
        baseUrl,
        `/tasks/${createB.body.tarea.id}`,
        jsonRequest('PATCH', { titulo: 'Modificada por A' }, loginA.body.token),
    );
    assert.equal(crossUserUpdate.response.status, 404);

    const crossUserDelete = await request(
        baseUrl,
        `/tasks/${createB.body.tarea.id}`,
        jsonRequest('DELETE', undefined, loginA.body.token),
    );
    assert.equal(crossUserDelete.response.status, 404);

    const ownerTaskAfterDeniedDelete = await request<{ tarea: { id: string } }>(
        baseUrl,
        `/tasks/${createB.body.tarea.id}`,
        jsonRequest('GET', undefined, loginB.body.token),
    );
    assert.equal(ownerTaskAfterDeniedDelete.response.status, 200);
    assert.equal(ownerTaskAfterDeniedDelete.body.tarea.id, createB.body.tarea.id);

    const updateA = await request<{ tarea: { estado: string } }>(
        baseUrl,
        `/tasks/${createA.body.tarea.id}`,
        jsonRequest('PATCH', { estado: 'completada', descripcion: null }, loginA.body.token),
    );
    assert.equal(updateA.response.status, 200);
    assert.equal(updateA.body.tarea.estado, 'completada');

    const invalidTask = await request(
        baseUrl,
        '/tasks',
        jsonRequest('POST', { titulo: ' ', estado: 'desconocido' }, loginA.body.token),
    );
    assert.equal(invalidTask.response.status, 400);

    const malformedJson = await request(baseUrl, '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
    });
    assert.equal(malformedJson.response.status, 400);

    const missingRoute = await request(baseUrl, '/ruta-inexistente');
    assert.equal(missingRoute.response.status, 404);
    assert.equal('error' in missingRoute.body, true);

    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
        const insecureRequest = await request(baseUrl, '/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        assert.equal(insecureRequest.response.status, 426);

        const healthCheck = await request(baseUrl, '/health');
        assert.equal(healthCheck.response.status, 200);
    } finally {
        if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = originalNodeEnv;
    }

    const deleteA = await request(
        baseUrl,
        `/tasks/${createA.body.tarea.id}`,
        jsonRequest('DELETE', undefined, loginA.body.token),
    );
    assert.equal(deleteA.response.status, 200);
    const deletedA = await request(
        baseUrl,
        `/tasks/${createA.body.tarea.id}`,
        jsonRequest('GET', undefined, loginA.body.token),
    );
    assert.equal(deletedA.response.status, 404);

    let rateLimited = false;
    for (let attempt = 0; attempt < 12 && !rateLimited; attempt += 1) {
        const response = await request(
            baseUrl,
            '/auth/login',
            jsonRequest('POST', {}),
        );
        rateLimited = response.response.status === 429;
    }
    assert.equal(rateLimited, true);
});
