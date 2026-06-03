import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

/**
 * Bootstrap the NestJS application
 * - Creates the application using AppModule
 * - Listens on the port specified in environment variables or defaults to 3000
 * - Catches and logs any errors during startup, then exits with failure code
 * @returns {Promise<void>} A promise that resolves when the application has started successfully
 */
async function bootstrap(): Promise<void> {
  const app: INestApplication<any> = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const allowedOrigins: string[] = configService
    .get<string>('ALLOWED_ORIGINS')
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? ['*'];

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

  app.use(helmet());

  //Bind the document directly to Scalar instead of Swagger UI
  app.use(
    '/docs', // The URL path where your documentation will be served
    apiReference({
      spec: {
        content: document,
      },
    }),
  );

  // Automatically filters out non-whitelisted properties and enforces types
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = Number(configService.get<string>('PORT') || 3000);
  const nodeEnv = configService.get<string>('NODE_ENV');

  await app.listen(port);
  console.log(
    `Application is running on localhost:${port}`,
    nodeEnv !== 'production' ? `(${nodeEnv})` : '',
  );
}

bootstrap().catch((error) => {
  console.error('Error starting the application:', error);
  process.exit(1);
});
