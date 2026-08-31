"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const env_validation_1 = require("./config/env.validation");
const all_exceptions_filter_1 = require("./common/all-exceptions.filter");
async function createApp() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true,
        logger: process.env.NODE_ENV === 'production'
            ? ['error', 'warn']
            : ['log', 'error', 'warn', 'debug', 'verbose'],
    });
    const logger = new common_1.Logger('Bootstrap');
    (0, env_validation_1.validateEnv)();
    app.set('trust proxy', 1);
    app.use((0, helmet_1.default)({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: false,
    }));
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), { prefix: '/uploads' });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    const allowedOrigins = [
        ...new Set([
            ...(process.env.ALLOWED_ORIGINS ?? '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            'https://www.infludubai.com',
            'https://infludubai.com',
            'https://www.infludubai.ae',
            'https://infludubai.ae',
            'https://frontend-alpha-sage-23.vercel.app',
            ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3002'] : []),
        ]),
    ];
    app.enableCors({
        origin: (origin, cb) => {
            if (!origin || allowedOrigins.includes(origin))
                return cb(null, true);
            logger.warn(`Blocked CORS request from origin: ${origin}`);
            cb(null, false);
        },
        credentials: true,
    });
    app.enableShutdownHooks();
    logger.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
    return app;
}
async function bootstrap() {
    const app = await createApp();
    const port = process.env.PORT ?? 4001;
    const host = process.env.HOST ?? '0.0.0.0';
    await app.listen(port, host);
    new common_1.Logger('Bootstrap').log(`InfluDubai API listening on ${host}:${port} (prefix /api/v1)`);
}
if (require.main === module) {
    bootstrap().catch((err) => {
        console.error('Fatal: API failed to start', err);
        process.exit(1);
    });
}
//# sourceMappingURL=main.js.map