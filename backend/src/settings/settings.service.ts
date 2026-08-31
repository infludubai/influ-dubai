import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  decryptSecret,
  encryptSecret,
  isEncrypted,
  maskSecret,
} from './settings.crypto';
import {
  SETTING_DEFINITIONS,
  SETTING_GROUPS,
  SettingGroupId,
  getDefinition,
  isKnownSetting,
} from './settings.catalog';

/**
 * Ellipsis, Unicode replacement char, or a literal "..." — none of which
 * appear in a real API key, but all of which show up when a masked value is
 * echoed back, possibly after a charset round-trip.
 */
const MASK_LIKE = /[…�]|\.\.\./;

export interface MaskedSetting {
  key: string;
  label: string;
  group: SettingGroupId;
  isSecret: boolean;
  placeholder?: string;
  help?: string;
  numeric?: boolean;
  /** Masked for secrets, full value otherwise. Empty when unset. */
  value: string;
  configured: boolean;
  /** Where the effective value comes from, so admins can see what's winning. */
  source: 'database' | 'environment' | 'unset';
  updatedAt: string | null;
}

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  /**
   * Decrypted values, keyed by setting key. Populated on boot and kept in
   * sync on write, so hot paths (every AI call, every upload) don't hit the
   * database. Only ever mutated through `refresh()` and `set()`.
   */
  private cache = new Map<string, string>();
  private loaded = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async onModuleInit() {
    await this.refresh();
  }

  /** Reloads every stored setting from the database into the cache. */
  async refresh(): Promise<void> {
    try {
      const rows = await this.prisma.platformSetting.findMany();
      const next = new Map<string, string>();
      for (const row of rows) {
        if (!isKnownSetting(row.key)) continue; // stale key from an older release
        try {
          next.set(row.key, row.isSecret ? decryptSecret(row.value) : row.value);
        } catch {
          // A key rotation makes old ciphertext unreadable. Skip it rather than
          // failing boot — the feature falls back to env/mock and the admin
          // can re-enter the value.
          this.logger.error(
            `Could not decrypt setting "${row.key}" — it must be re-entered in Admin → Settings.`,
          );
        }
      }
      this.cache = next;
      this.loaded = true;
    } catch (err) {
      // Most likely the migration hasn't run yet. Env vars still work.
      this.logger.warn(
        `Could not load platform settings (${(err as Error).message}) — falling back to environment variables.`,
      );
      this.loaded = true;
    }
  }

  /**
   * Effective value for a key: database first, then the environment.
   * Database wins so an admin edit takes effect without a redeploy.
   */
  get(key: string): string | undefined {
    const stored = this.cache.get(key);
    if (stored?.trim()) return stored.trim();
    const fromEnv = process.env[key];
    return fromEnv?.trim() ? fromEnv.trim() : undefined;
  }

  getNumber(key: string, fallback: number): number {
    const raw = this.get(key);
    if (raw === undefined) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /** Reads a toggle. Admins type these by hand, so accept the usual spellings. */
  isOn(key: string): boolean {
    const raw = this.get(key)?.trim().toLowerCase();
    return raw === 'on' || raw === 'true' || raw === 'yes' || raw === '1';
  }

  private sourceOf(key: string): MaskedSetting['source'] {
    if (this.cache.get(key)?.trim()) return 'database';
    if (process.env[key]?.trim()) return 'environment';
    return 'unset';
  }

  /** Admin view: every known setting, with secrets masked. */
  async listForAdmin() {
    if (!this.loaded) await this.refresh();

    const rows = await this.prisma.platformSetting
      .findMany({ select: { key: true, updatedAt: true } })
      .catch(() => [] as { key: string; updatedAt: Date }[]);
    const updatedAtByKey = new Map(rows.map((r) => [r.key, r.updatedAt]));

    const settings: MaskedSetting[] = SETTING_DEFINITIONS.map((def) => {
      const effective = this.get(def.key);
      const source = this.sourceOf(def.key);
      return {
        key: def.key,
        label: def.label,
        group: def.group,
        isSecret: def.isSecret,
        placeholder: def.placeholder,
        help: def.help,
        numeric: def.numeric,
        value: effective
          ? def.isSecret
            ? maskSecret(effective)
            : effective
          : '',
        configured: Boolean(effective),
        source,
        updatedAt: updatedAtByKey.get(def.key)?.toISOString() ?? null,
      };
    });

    return { groups: SETTING_GROUPS, settings };
  }

  /**
   * Writes one setting. An empty value clears the override, falling back to
   * the environment variable (or disabling the feature if there isn't one).
   */
  async set(key: string, rawValue: string, actorId?: string): Promise<void> {
    const def = getDefinition(key);
    if (!def) throw new BadRequestException(`Unknown setting: ${key}`);

    const value = rawValue?.trim() ?? '';

    if (value && def.numeric && !Number.isFinite(Number(value))) {
      throw new BadRequestException(`${def.label} must be a number`);
    }

    if (def.isSecret && value) {
      const current = this.cache.get(key);

      // The admin UI renders stored secrets masked. Re-submitting an untouched
      // field is a no-op, not an overwrite.
      if (current && value === maskSecret(current)) return;

      // A mask that arrived with mangled encoding won't match above. Storing it
      // would silently destroy the real key and look identical in the UI, so
      // fail loudly instead of guessing.
      if (MASK_LIKE.test(value)) {
        throw new BadRequestException(
          `${def.label} looks like the masked placeholder rather than a real value. Clear the field and paste the full key.`,
        );
      }
    }

    if (!value) {
      await this.prisma.platformSetting
        .delete({ where: { key } })
        .catch(() => undefined); // already absent
      this.cache.delete(key);
    } else {
      const stored = def.isSecret ? encryptSecret(value) : value;
      await this.prisma.platformSetting.upsert({
        where: { key },
        create: { key, value: stored, isSecret: def.isSecret, updatedById: actorId },
        update: { value: stored, isSecret: def.isSecret, updatedById: actorId },
      });
      this.cache.set(key, value);
    }

    // Never log the value itself — only that it changed.
    this.audit.log({
      userId: actorId,
      action: value ? 'settings.update' : 'settings.clear',
      resource: 'platform_setting',
      resourceId: key,
      meta: { group: def.group, isSecret: def.isSecret },
    });
  }

  async setMany(
    values: Record<string, string>,
    actorId?: string,
  ): Promise<void> {
    for (const [key, value] of Object.entries(values)) {
      await this.set(key, value, actorId);
    }
  }
}
