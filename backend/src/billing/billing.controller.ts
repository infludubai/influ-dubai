import {
  Body, Controller, Get, Headers, Post, Req, UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BillingService, PLANS } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  // Public: plan definitions
  @Get('plans')
  getPlans() {
    return PLANS;
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  getSubscription(@CurrentUser() user: { id: string }) {
    return this.billing.getSubscription(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  createCheckout(
    @CurrentUser() user: { id: string },
    @Body('plan') plan: 'PROFESSIONAL' | 'ENTERPRISE',
    @Body('successUrl') successUrl: string,
    @Body('cancelUrl') cancelUrl: string,
  ) {
    return this.billing.createCheckoutSession(
      user.id,
      plan,
      successUrl ?? 'http://localhost:3002/dashboard/billing?success=1',
      cancelUrl ?? 'http://localhost:3002/pricing',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('portal')
  createPortal(
    @CurrentUser() user: { id: string },
    @Body('returnUrl') returnUrl: string,
  ) {
    return this.billing.createPortalSession(
      user.id,
      returnUrl ?? 'http://localhost:3002/dashboard/billing',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  cancel(@CurrentUser() user: { id: string }) {
    return this.billing.cancelSubscription(user.id);
  }

  // Stripe webhook — no auth guard, uses raw body for signature verification
  @SkipThrottle()
  @Post('webhook')
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    await this.billing.handleWebhook(req.rawBody!, sig);
    return { received: true };
  }
}
