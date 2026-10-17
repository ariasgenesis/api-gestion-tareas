-- Esquema de base de datos

CREATE TABLE usuarios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(255) NOT NULL,
    hash_contrasena VARCHAR(255) NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT usuarios_nombre_no_vacio
        CHECK (LENGTH(TRIM(nombre)) > 0),

    CONSTRAINT usuarios_correo_no_vacio
        CHECK (LENGTH(TRIM(correo)) > 0)
);


CREATE UNIQUE INDEX usuarios_correo_unico
    ON usuarios (LOWER(correo));


CREATE TABLE tareas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_vencimiento TIMESTAMPTZ,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT tareas_usuario_fk
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
        ON DELETE CASCADE,

    CONSTRAINT tareas_titulo_no_vacio
        CHECK (LENGTH(TRIM(titulo)) > 0),

    CONSTRAINT tareas_estado_valido
        CHECK (estado IN ('pendiente', 'en curso', 'completada'))
);


CREATE INDEX tareas_usuario_id_idx
    ON tareas (usuario_id);


GRANT USAGE ON SCHEMA public TO task_app;


GRANT SELECT, INSERT, UPDATE, DELETE
    ON ALL TABLES IN SCHEMA public
    TO task_app;


GRANT USAGE, SELECT
    ON ALL SEQUENCES IN SCHEMA public
    TO task_app;


ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLES TO task_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT
    ON SEQUENCES TO task_app;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;