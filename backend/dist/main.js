"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.enableCors({
        origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
        credentials: true,
    });
    const port = process.env.PORT ?? 4000;
    await app.listen(port);
    console.log(`InfluDubai API listening on http://localhost:${port}/api/v1`);
}
bootstrap();
//# sourceMappingURL=main.js.map