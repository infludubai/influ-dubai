import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { validateEnv } from './config/env.validation';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const logger = new Logger('Bootstrap');

  // Runs after creation so ConfigModule has already merged .env into process.env.
  validateEnv();

  // Behind Render/Vercel the socket address is the proxy, not the client.
  // Without this every visitor shares one rate-limit bucket and a single
  // busy user can lock everyone else out.
  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false, // needed for some Next.js assets
      contentSecurityPolicy: false, // managed by Next.js
    }),
  );

  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Never leak stack traces to clients; log them with a traceable reference.
  app.useGlobalFilters(new AllExceptionsFilter());

  // The production domains are not secrets — baking them in as defaults means
  // a mis-saved dashboard env var can never take the real site down. Extra
  // origins can still be added via ALLOWED_ORIGINS without a deploy.
  const allowedOrigins = [
    ...new Set(
      [
        ...(process.env.ALLOWED_ORIGINS ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        'https://www.infludubai.com',
        'https://infludubai.com',
        'https://infludubai.vercel.app',
        ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3002'] : []),
      ],
    ),
  ];

  app.enableCors({
    origin: (origin, cb) => {
      // No Origin header means a same-origin, server-to-server or health-check
      // request — browsers always send one for cross-origin calls.
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      logger.warn(`Blocked CORS request from origin: ${origin}`);
      // Deny by withholding the CORS headers rather than throwing. Throwing
      // surfaces as a 500, which reads as a server fault in logs and metrics;
      // the browser blocks the response either way.
      cb(null, false);
    },
    credentials: true,
  });

  // Lets Prisma close its pool and in-flight requests drain on SIGTERM,
  // which is how Render stops an instance during a deploy.
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 4001;
  await app.listen(port, '0.0.0.0');
  logger.log(`InfluDubai API listening on port ${port} (prefix /api/v1)`);
  logger.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal: API failed to start', err);
  process.exit(1);
});
