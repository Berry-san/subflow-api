// import { ValidationPipe } from '@nestjs/common';
// import { NestFactory } from '@nestjs/core';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { json, urlencoded } from 'express';
// import helmet from 'helmet';
// import { AppModule } from './app.module';
// import { winstonLogger } from './config/logger.config';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule, {
//     logger: winstonLogger,
//   });

//   app.setGlobalPrefix('api/v1');

//   // Security: Helmet for security headers
//   app.use(helmet());

//   // Security: Request size limits
//   app.use(json({ limit: '10kb' }));
//   app.use(urlencoded({ extended: true, limit: '10kb' }));

//   // Security: CORS configuration
//   app.enableCors({
//     origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//   });

//   // Global HTTP logging
//   const { LoggingInterceptor } = await import('./common/interceptors/logging.interceptor');
//   app.useGlobalInterceptors(new LoggingInterceptor());

//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true,
//       transform: true,
//       forbidNonWhitelisted: true,
//     }),
//   );


//   const config = new DocumentBuilder()
//     .setTitle('Sublow API')
//     .setDescription('The Sublow Backend API description')
//     .setVersion('1.0')
//     .addBearerAuth()
//     .build();
//   const document = SwaggerModule.createDocument(app, config);
//   SwaggerModule.setup('api/v1/docs', app, document);

//   await app.listen(process.env.PORT || 5500);
// }
// bootstrap();

// src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { winstonLogger } from './config/logger.config';

async function bootstrap() {
  // 🚀 Run Prisma migrations in production
  if (process.env.NODE_ENV === 'production') {
    const { execSync } = require('child_process');
    const logger = console; // Use console since Nest logger isn't ready yet
    
    logger.log('🔄 Running Prisma migrations...');
    try {
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        env: {
          ...process.env,
          PRISMA_HIDE_UPDATE_MESSAGE: 'true',
        },
      });
      logger.log('✅ Migrations completed successfully');
    } catch (error) {
      logger.error('❌ Prisma migration failed - exiting');
      process.exit(1);
    }

    // 🌱 Run seeding ONLY if explicitly enabled (run once!)
    if (process.env.RUN_SEED === 'true') {
      logger.log('🌱 Running database seed...');
      try {
        execSync('npx prisma db seed', {
          stdio: 'inherit',
          env: process.env,
        });
        logger.log('✅ Seeding completed');
      } catch (error) {
        logger.error('❌ Seeding failed');
        process.exit(1);
      }
    }
  }

  const app = await NestFactory.create(AppModule, {
    logger: winstonLogger,
  });

  app.setGlobalPrefix('api/v1');

  // Security: Helmet for security headers
  app.use(helmet());

  // Security: Request size limits
  app.use(json({ limit: '10kb' }));
  app.use(urlencoded({ extended: true, limit: '10kb' }));

  // Security: CORS configuration
  app.enableCors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global HTTP logging
  const { LoggingInterceptor } = await import('./common/interceptors/logging.interceptor');
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Sublow API')
    .setDescription('The Sublow Backend API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  await app.listen(process.env.PORT || 5500);
}
bootstrap();