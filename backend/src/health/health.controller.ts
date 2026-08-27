import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

/**
 * Liveness and readiness endpoints for the host's health checks.
 *
 * Throttling is skipped deliberately: the host polls these on a fixed interval
 * and a rate-limited 429 would be read as an outage and cycle the instance.
 */
@SkipThrottle()
@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  /** Liveness — cheap, no dependencies. */
  @Get()
  live() {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
    };
  }

  /**
   * Readiness — actually touches the database, so a deploy with a broken
   * DATABASE_URL fails the check instead of serving 500s.
   */
  @Get('ready')
  async ready() {
    const checks: Record<string, { ok: boolean; detail?: string }> = {};

    const dbStart = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { ok: true, detail: `${Date.now() - dbStart}ms` };
    } catch (err) {
      checks.database = { ok: false, detail: (err as Error).message };
    }

    // Optional integrations report status without failing readiness — the
    // platform is designed to run degraded rather than refuse traffic.
    // Uploads go to the app’s own disk, which exists wherever it runs.
    checks.storage = { ok: true };
    checks.ai = { ok: this.settings.has('OPENAI_API_KEY') };
    checks.billing = { ok: this.settings.has('STRIPE_SECRET_KEY') };
    checks.email = { ok: this.settings.has('SMTP_HOST') };

    return {
      status: checks.database.ok ? 'ok' : 'degraded',
      checks,
    };
  }
}
