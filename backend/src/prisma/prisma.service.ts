import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, RoleName } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    await this.ensureReferenceData();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Enum-backed reference rows the app cannot function without. Registration
   * resolves a Role row by name, so an empty roles table makes every signup
   * 500. The demo seed used to create these, but it is blocked in production
   * (it also inserts fake marketplace data) — so real reference data is
   * ensured here instead, idempotently, on every boot.
   */
  private async ensureReferenceData() {
    try {
      for (const name of Object.values(RoleName)) {
        await this.role.upsert({
          where: { name },
          create: { name, description: `${name} role` },
          update: {},
        });
      }

      // Email verification was removed — activate anyone who registered while
      // the pending state still existed, so no account stays stuck in limbo.
      const activated = await this.user.updateMany({
        where: { status: 'PENDING_VERIFICATION' },
        data: { status: 'ACTIVE' },
      });
      if (activated.count > 0) {
        this.logger.log(`Auto-activated ${activated.count} pending account(s)`);
      }
    } catch (err) {
      // Boot should not die over this — but signups will fail until it heals,
      // so make the cause loud in the logs.
      this.logger.error(
        `Could not ensure role reference data: ${(err as Error).message}`,
      );
    }
  }
}
