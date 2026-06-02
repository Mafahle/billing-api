import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Bootstrap the NestJS application
 * - Creates the application using AppModule
 * - Listens on the port specified in environment variables or defaults to 3000
 * - Catches and logs any errors during startup, then exits with failure code
 * @returns {Promise<void>} A promise that resolves when the application has started successfully
 */

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

bootstrap().catch((error) => {
  console.error('Error starting the application:', error);
  process.exit(1);
});
