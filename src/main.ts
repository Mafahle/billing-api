import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import dotenv from 'dotenv';
import { INestApplication } from '@nestjs/common';

dotenv.config();

/**
 * Bootstrap the NestJS application
 * - Creates the application using AppModule
 * - Listens on the port specified in environment variables or defaults to 3000
 * - Catches and logs any errors during startup, then exits with failure code
 * @returns {Promise<void>} A promise that resolves when the application has started successfully
 */

async function bootstrap(): Promise<void> {
  const app: INestApplication<any> = await NestFactory.create(AppModule);

  const allowedOrigins: string[] = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['*']; // Default to allow all origins if not specified

  // Use NestJS Swagger to build and generate the OpenAPI document structure
  const config = new DocumentBuilder()
    .setTitle('Billing API')
    .setDescription('BCB BLINC Client billing API')
    .setVersion('1.0')
    .addBearerAuth() // Example decorator config
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.enableCors({
    origin: allowedOrigins,
  });

  //Bind the document directly to Scalar instead of Swagger UI
  app.use(
    '/docs', // The URL path where your documentation will be served
    apiReference({
      spec: {
        content: document,
      },
    }),
  );

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
  console.log(
    `Application is running on localhost:${process.env.PORT && process.env.NODE_ENV !== 'production' ? Number(process.env.PORT) : 3000}`,
  );
}

bootstrap().catch((error) => {
  console.error('Error starting the application:', error);
  process.exit(1);
});
