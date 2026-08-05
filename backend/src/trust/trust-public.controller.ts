import { Controller, Get, Param } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

/**
 * Unauthenticated review listings.
 *
 * Deliberately separate from TrustController, which applies JwtAuthGuard to
 * every route: public creator profiles are viewable while logged out, so
 * reviews must be readable without a token or they would silently disappear
 * for exactly the visitors the social proof is aimed at.
 */
@Controller()
export class TrustPublicController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('creators/:creatorProfileId/reviews')
  creatorReviews(@Param('creatorProfileId') id: string) {
    return this.reviews.listForCreator(id);
  }

  @Get('brands/:brandProfileId/reviews')
  brandReviews(@Param('brandProfileId') id: string) {
    return this.reviews.listForBrand(id);
  }
}
