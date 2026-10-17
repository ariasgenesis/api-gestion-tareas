import dotenv from 'dotenv';
import path from 'path';

// Carga las variables del archivo .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

class Config {
    private static instance: Config;

    public readonly PORT: number;
    public readonly DB_HOST: string;
    public readonly DB_PORT: number;
    public readonly DB_USER: string;
    public readonly DB_PASSWORD?: string | undefined;
    public readonly DB_NAME: string;
    public readonly JWT_SECRET: string;

    private constructor() {
        this.PORT = Number(process.env.PORT) || 3000;
        this.DB_HOST = process.env.DB_HOST || 'localhost';
        this.DB_PORT = Number(process.env.DB_PORT) || 5432;
        this.DB_USER = process.env.DB_USER || 'postgres';
        this.DB_PASSWORD = process.env.DB_PASSWORD;
        this.DB_NAME = process.env.DB_NAME || 'tareas_db';
        this.JWT_SECRET = process.env.JWT_SECRET || 'secreto_por_defecto';
    }

    public static getInstance(): Config {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }
}

export const config = Config.getInstance();