import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { validateEnv } from './config/env.validation';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

/**
 * Builds and configures the API without binding a port.
 *
 * Exported because GoDaddy's sandbox permits exactly one listening socket —
 * the port it assigns — so the single-process entry point mounts this app on
 * its own server alongside Next.js rather than running it separately.
 */
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const logger = new Logger('Bootstrap');

  // Runs after creation so ConfigModule has already merged .env into process.env.
  validateEnv();

  // Behind a hosting proxy the socket address is the proxy, not the client.
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
        // .ae is the primary UAE domain, registered with Tasjeel.
        'https://www.infludubai.ae',
        'https://infludubai.ae',
        // The Vercel project's technical alias — kept so the site still works
        // if the custom domain's DNS ever breaks.
        'https://frontend-alpha-sage-23.vercel.app',
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
  // which is how the host stops an instance during a deploy.
  app.enableShutdownHooks();

  logger.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
  return app;
}

async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT ?? 4001;
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  new Logger('Bootstrap').log(
    `InfluDubai API listening on ${host}:${port} (prefix /api/v1)`,
  );
}

// Only self-start when run as the entry point. Imported by the single-process
// server, this module must not bind anything of its own.
if (require.main === module) {
  bootstrap().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Fatal: API failed to start', err);
    process.exit(1);
  });
}
