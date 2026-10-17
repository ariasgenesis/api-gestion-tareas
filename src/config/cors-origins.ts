/** Parses, validates, and canonicalizes the configured browser origins. */
export function parseCorsOrigins(
    configuredValue: string | undefined,
    nodeEnv: string | undefined,
): string[] {
    if (!configuredValue && nodeEnv === 'production') {
        throw new Error('CORS_ORIGINS es obligatoria en producción.');
    }

    const configured = configuredValue ?? 'http://localhost:5173';
    const configuredOrigins = configured
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (configuredOrigins.length === 0) {
        throw new Error('CORS_ORIGINS debe contener al menos un origen permitido.');
    }

    const origins = configuredOrigins.map((origin) => {
        let parsed: URL;
        try {
            parsed = new URL(origin);
        } catch {
            throw new Error('CORS_ORIGINS contiene un origen no válido.');
        }

        if (
            !['http:', 'https:'].includes(parsed.protocol) ||
            parsed.pathname !== '/' ||
            parsed.search !== '' ||
            parsed.hash !== '' ||
            parsed.username !== '' ||
            parsed.password !== ''
        ) {
            throw new Error(
                'Cada valor de CORS_ORIGINS debe ser un origen HTTP o HTTPS sin ruta.',
            );
        }

        // URL.origin removes a harmless trailing slash and canonicalizes the host.
        return parsed.origin;
    });

    return [...new Set(origins)];
}
