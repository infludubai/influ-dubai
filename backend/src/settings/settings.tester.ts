import { Injectable, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Stripe from 'stripe';
import { SettingsService } from './settings.service';
import { SettingGroupId } from './settings.catalog';

export interface TestResult {
  ok: boolean;
  message: string;
}

/**
 * Live credential checks for the "Test connection" button in Admin → Settings.
 * Each probe is the cheapest authenticated call the provider offers, so
 * clicking test costs effectively nothing.
 */
@Injectable()
export class SettingsTester {
  private readonly logger = new Logger(SettingsTester.name);

  constructor(private readonly settings: SettingsService) {}

  async test(group: SettingGroupId): Promise<TestResult> {
    try {
      switch (group) {
        case 'openai':
          return await this.testOpenAi();
        case 'stripe':
          return await this.testStripe();
        case 'supabase':
          return await this.testSupabase();
        case 'smtp':
          return this.testSmtp();
        default:
          return { ok: false, message: 'This section has nothing to test.' };
      }
    } catch (err) {
      const message = (err as Error).message ?? 'Unknown error';
      this.logger.warn(`Connection test failed for ${group}: ${message}`);
      return { ok: false, message };
    }
  }

  private async testOpenAi(): Promise<TestResult> {
    const apiKey = this.settings.get('OPENAI_API_KEY');
    if (!apiKey) return { ok: false, message: 'No API key configured.' };

    const client = new OpenAI({ apiKey });
    const models = await client.models.list();
    const wanted = this.settings.get('OPENAI_MODEL') ?? 'gpt-4o-mini';
    const available = models.data.some((m) => m.id === wanted);

    return {
      ok: true,
      message: available
        ? `Connected. Model "${wanted}" is available.`
        : `Connected, but model "${wanted}" was not found on this account — AI calls will fail until you pick an available model.`,
    };
  }

  private async testStripe(): Promise<TestResult> {
    const apiKey = this.settings.get('STRIPE_SECRET_KEY');
    if (!apiKey) return { ok: false, message: 'No secret key configured.' };

    // balance.retrieve is the cheapest call that still proves the key is valid.
    const stripe = new Stripe(apiKey);
    const balance = await stripe.balance.retrieve();
    const mode = apiKey.startsWith('sk_live') ? 'LIVE' : 'test';
    const currencies = [
      ...new Set(balance.available.map((b) => b.currency.toUpperCase())),
    ];

    return {
      ok: true,
      message: `Connected in ${mode} mode${
        currencies.length ? ` (balance currencies: ${currencies.join(', ')})` : ''
      }.`,
    };
  }

  private async testSupabase(): Promise<TestResult> {
    const url = this.settings.get('SUPABASE_URL');
    const key = this.settings.get('SUPABASE_SERVICE_KEY');
    if (!url || !key) {
      return { ok: false, message: 'Project URL and service key are both required.' };
    }

    const client = createClient(url, key);
    const { data, error } = await client.storage.listBuckets();
    if (error) return { ok: false, message: error.message };

    const names = data.map((b) => b.name);
    const required = ['avatars', 'logos', 'media-kits'];
    const missing = required.filter((b) => !names.includes(b));

    return {
      ok: missing.length === 0,
      message: missing.length
        ? `Connected, but these buckets are missing: ${missing.join(', ')}. Create them in Supabase → Storage and mark them public.`
        : `Connected. All three storage buckets exist.`,
    };
  }

  private testSmtp(): TestResult {
    const host = this.settings.get('SMTP_HOST');
    const from = this.settings.get('MAIL_FROM');
    if (!host) {
      return {
        ok: false,
        message: 'No SMTP host configured — emails are being written to the server log.',
      };
    }
    if (!from) {
      return { ok: false, message: 'Set a From address before sending mail.' };
    }
    return {
      ok: true,
      message: `SMTP configured for ${host}. Trigger a password reset to send a real test message.`,
    };
  }
}
