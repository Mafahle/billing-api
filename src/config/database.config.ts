import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

type Environment = 'test' | 'development' | 'production';
type DatabaseType = 'better-sqlite3' | 'postgres';

/**
 * Get TypeORM configuration based on NODE_ENV
 * - test: In-memory SQLite
 * - development: File-based SQLite at ./database directory
 * - production: PostgreSQL with URI and credentials
 * @returns {TypeOrmModuleOptions} TypeORM configuration for the current environment
 * @throws {Error} If NODE_ENV is unknown or required environment variables are missing in production
 */
export function getDatabaseConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const env: string = (configService.get<string>('NODE_ENV') ||
    'development') as Environment;

  switch (env) {
    case 'test':
      return getTestConfig();
    case 'development':
      return getDevelopmentConfig(configService);
    case 'production':
      return getProductionConfig(configService);
    default:
      throw new Error(`Unknown environment: ${env}`);
  }
}

/**
 * Test environment: In-memory SQLite
 * @returns {TypeOrmModuleOptions} TypeORM configuration for test environment
 */
function getTestConfig(): TypeOrmModuleOptions {
  return {
    type: 'better-sqlite3' as DatabaseType,
    database: ':memory:',
    entities: [join(__dirname, '..', '**', '*.entity.ts')], // discover entities in src/entities
    migrations: [join(__dirname, '..', 'migrations', '*.ts')],
    synchronize: true,
    logging: false,
  };
}

/**
 * Development environment: File-based SQLite at ./database directory
 * @returns {TypeOrmModuleOptions} TypeORM configuration for development environment
 */
function getDevelopmentConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const dbPath: string =
    configService.get<string>('DB_PATH') ||
    join(process.cwd(), 'database', 'data-dev.db');

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
 * @returns {TypeOrmModuleOptions} TypeORM configuration for production environment
 * @throws {Error} If DB_URI or DB_PASSWORD is missing in production environment
 * @throws {Error} if DB_PASSWORD is missing in production environment
 */
function getProductionConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const dbUri: string | undefined = configService.get<string>('DB_URI');
  const dbPassword: string | undefined =
    configService.get<string>('DB_PASSWORD');

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
