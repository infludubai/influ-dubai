import { Injectable, Logger } from '@nestjs/common';
import type OpenAI from 'openai';
import type Stripe from 'stripe';
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

    // eslint-disable-next-line @typescript-eslint/no-var-requires

    const OpenAI = require('openai');

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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe');
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
