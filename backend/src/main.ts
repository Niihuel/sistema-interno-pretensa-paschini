import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug'],
  });

  // Security Headers - Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny',
    },
    noSniff: true,
    xssFilter: true,
  }));

  // Enable CORS - STRICT for production
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [
    'http://192.168.0.219:4350',
  ];

  const isProduction = process.env.NODE_ENV === 'production';

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests without origin (from proxy, curl, postman, etc) in development
      // or from localhost proxy in production
      if (!origin) {
        return callback(null, true);
      }

      // Allow if origin is in whitelist
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    maxAge: 86400, // 24 hours
  });

  // Global validation pipe - Strict
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: isProduction,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Body parser limits - Security
  app.use(express.json({ limit: '5mb' })); // Reduced from 10mb for security
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Disable X-Powered-By header
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';

  await app.listen(port, host);

}

bootstrap();
