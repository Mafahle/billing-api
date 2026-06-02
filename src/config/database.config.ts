import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

type Environment = 'test' | 'development' | 'production';
type DatabaseType = 'better-sqlite3' | 'postgres';

/**
 * Get TypeORM configuration based on NODE_ENV
 * - test: In-memory SQLite
 * - development: File-based SQLite at ./database directory
 * - production: PostgreSQL with URI and credentials
 */
export function getDatabaseConfig(): TypeOrmModuleOptions {
  const env: string = (process.env.NODE_ENV || 'development') as Environment;

  switch (env) {
    case 'test':
      return getTestConfig();
    case 'development':
      return getDevelopmentConfig();
    case 'production':
      return getProductionConfig();
    default:
      throw new Error(`Unknown environment: ${env}`);
  }
}

/**
 * Test environment: In-memory SQLite
 */
function getTestConfig(): TypeOrmModuleOptions {
  return {
    type: 'better-sqlite3' as DatabaseType,
    database: ':memory:',
    entities: [join(__dirname, '..', '**', '*.entity.ts')],
    migrations: [join(__dirname, '..', 'migrations', '*.ts')],
    synchronize: true,
    logging: false,
  };
}

/**
 * Development environment: File-based SQLite at ./database directory
 */
function getDevelopmentConfig(): TypeOrmModuleOptions {
  const dbPath: string = process.env.DB_PATH
    ? process.env.DB_PATH
    : join(process.cwd(), 'database', 'data-dev.db');

  return {
    type: 'better-sqlite3' as DatabaseType,
    database: dbPath,
    entities: [join(__dirname, '..', '**', '*.entity.ts')],
    migrations: [join(__dirname, '..', 'migrations', '*.ts')],
    synchronize: true,
    logging: true,
  };
}

/**
 * Production environment: PostgreSQL with URI and credentials
 */
function getProductionConfig(): TypeOrmModuleOptions {
  const dbUri: string | undefined = process.env.DB_URI;
  const dbPassword: string | undefined = process.env.DB_PASSWORD;

  if (!dbUri || dbUri.trim() === '') {
    throw new Error('DB_URI is required for production environment');
  }

  if (!dbPassword || dbPassword.trim() === '') {
    throw new Error('DB_PASSWORD is required for production environment');
  }

  return {
    type: 'postgres' as DatabaseType,
    url: dbUri,
    password: dbPassword,
    entities: [join(__dirname, '..', '**', '*.entity.ts')],
    migrations: [join(__dirname, '..', 'migrations', '*.ts')],
    synchronize: false,
    logging: false,
    migrationsRun: true,
    ssl: { rejectUnauthorized: false },
  };
}
