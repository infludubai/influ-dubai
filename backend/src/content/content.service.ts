import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CONTENT_FIELDS,
  CONTENT_PAGES,
  defaults,
  getField,
} from './content.catalog';

@Injectable()
export class ContentService implements OnModuleInit {
  private readonly logger = new Logger(ContentService.name);

  /**
   * Merged defaults + stored overrides. Cached because the public endpoint is
   * hit on every marketing page render; kept in sync on write rather than
   * expiring, so an edit is visible immediately.
   */
  private cache: Record<string, string> = defaults();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async onModuleInit() {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const merged = defaults();
    try {
      const rows = await this.prisma.siteContent.findMany();
      for (const row of rows) {
        // Silently drop keys retired in a later release rather than serving
        // copy that no template reads any more.
        if (row.key in merged) merged[row.key] = row.value;
      }
    } catch (err) {
      this.logger.warn(
        `Could not load site content (${(err as Error).message}) — serving built-in defaults.`,
      );
    }
    this.cache = merged;
  }

  /** Public payload consumed by the frontend on render. */
  getPublic(): Record<string, string> {
    return this.cache;
  }

  /** Admin payload: field metadata plus current and default values. */
  async listForAdmin() {
    const rows = await this.prisma.siteContent
      .findMany({ select: { key: true, updatedAt: true } })
      .catch(() => [] as { key: string; updatedAt: Date }[]);
    const updatedAt = new Map(rows.map((r) => [r.key, r.updatedAt]));

    return {
      pages: CONTENT_PAGES,
      fields: CONTENT_FIELDS.map((f) => ({
        key: f.key,
        label: f.label,
        page: f.page,
        section: f.section,
        type: f.type,
        help: f.help,
        columns: f.columns,
        value: this.cache[f.key] ?? f.default,
        defaultValue: f.default,
        customised: this.cache[f.key] !== f.default,
        updatedAt: updatedAt.get(f.key)?.toISOString() ?? null,
      })),
    };
  }

  async set(key: string, rawValue: string, actorId?: string) {
    const field = getField(key);
    if (!field) throw new BadRequestException(`Unknown content key: ${key}`);

    const value = (rawValue ?? '').trim();

    if (field.type === 'number' && value && !Number.isFinite(Number(value))) {
      throw new BadRequestException(`${field.label} must be a number.`);
    }

    if (field.type === 'rows' && value) {
      const expected = field.columns?.length ?? 2;
      const bad = value
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .findIndex((line) => line.split('|').length !== expected);
      if (bad !== -1) {
        throw new BadRequestException(
          `${field.label}: line ${bad + 1} must have ${expected} values separated by "|" (${field.columns?.join(', ')}).`,
        );
      }
    }

    if (!value || value === field.default) {
      // Storing a value identical to the default just creates drift, and an
      // empty value means "go back to the built-in copy".
      await this.prisma.siteContent.deleteMany({ where: { key } });
      this.cache[key] = field.default;
    } else {
      await this.prisma.siteContent.upsert({
        where: { key },
        create: { key, value, updatedById: actorId },
        update: { value, updatedById: actorId },
      });
      this.cache[key] = value;
    }

    this.audit.log({
      userId: actorId,
      action: value ? 'content.update' : 'content.reset',
      resource: 'site_content',
      resourceId: key,
      meta: { page: field.page, section: field.section },
    });
  }

  async setMany(values: Record<string, string>, actorId?: string) {
    for (const [key, value] of Object.entries(values)) {
      await this.set(key, value, actorId);
    }
    return this.listForAdmin();
  }

  /** Restores every field on a page to the copy that shipped. */
  async resetPage(page: string, actorId?: string) {
    const keys = CONTENT_FIELDS.filter((f) => f.page === page).map((f) => f.key);
    if (keys.length === 0) throw new BadRequestException(`Unknown page: ${page}`);

    await this.prisma.siteContent.deleteMany({ where: { key: { in: keys } } });
    for (const key of keys) this.cache[key] = getField(key)!.default;

    this.audit.log({
      userId: actorId,
      action: 'content.reset_page',
      resource: 'site_content',
      resourceId: page,
    });

    return this.listForAdmin();
  }
}
