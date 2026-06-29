import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreatorsService } from './creators.service';
import { UpsertCreatorProfileDto } from './dto/upsert-creator-profile.dto';
import { UpsertSocialAccountDto } from './dto/upsert-social-account.dto';
import { CreatePortfolioItemDto } from './dto/create-portfolio-item.dto';

const uploadStorage = (dest: string) =>
  diskStorage({
    destination: join(process.cwd(), 'uploads', dest),
    filename: (_req, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname)}`),
  });

@Controller('creators')
export class CreatorsController {
  constructor(private readonly creators: CreatorsService) {}

  // --- Public listing ---
  @Get()
  list(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('location') location?: string,
    @Query('language') language?: string,
    @Query('minFollowers') minFollowers?: string,
    @Query('maxFollowers') maxFollowers?: string,
    @Query('minRate') minRate?: string,
    @Query('maxRate') maxRate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.creators.listPublicProfiles({
      q,
      category,
      location,
      language,
      minFollowers: minFollowers ? Number(minFollowers) : undefined,
      maxFollowers: maxFollowers ? Number(maxFollowers) : undefined,
      minRate: minRate ? Number(minRate) : undefined,
      maxRate: maxRate ? Number(maxRate) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get(':id')
  getPublic(@Param('id') id: string) {
    return this.creators.getPublicProfile(id);
  }

  // --- Authenticated (own profile) ---
  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  getMyProfile(@CurrentUser() user: { id: string }) {
    return this.creators.getMyProfile(user.id).then((profile) => ({
      profile,
      completionScore: this.creators.completionScore(profile),
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  upsertProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpsertCreatorProfileDto,
  ) {
    return this.creators.upsertProfile(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/profile/image')
  @UseInterceptors(FileInterceptor('file', { storage: uploadStorage('avatars') }))
  uploadProfileImage(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = `/uploads/avatars/${file.filename}`;
    return this.creators.updateProfileImage(user.id, url);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/profile/media-kit')
  @UseInterceptors(FileInterceptor('file', { storage: uploadStorage('media-kits') }))
  uploadMediaKit(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = `/uploads/media-kits/${file.filename}`;
    return this.creators.updateMediaKit(user.id, url);
  }

  // --- Social accounts ---
  @UseGuards(JwtAuthGuard)
  @Post('me/social-accounts')
  upsertSocialAccount(
    @CurrentUser() user: { id: string },
    @Body() dto: UpsertSocialAccountDto,
  ) {
    return this.creators.upsertSocialAccount(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/social-accounts/:platform')
  deleteSocialAccount(
    @CurrentUser() user: { id: string },
    @Param('platform') platform: string,
  ) {
    return this.creators.deleteSocialAccount(user.id, platform.toUpperCase());
  }

  // --- Portfolio ---
  @UseGuards(JwtAuthGuard)
  @Post('me/portfolio')
  @UseInterceptors(FileInterceptor('file', { storage: uploadStorage('portfolio') }))
  createPortfolioItem(
    @CurrentUser() user: { id: string },
    @Body() dto: CreatePortfolioItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const mediaUrl = file ? `/uploads/portfolio/${file.filename}` : undefined;
    return this.creators.createPortfolioItem(user.id, dto, mediaUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/portfolio/:id')
  deletePortfolioItem(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.creators.deletePortfolioItem(user.id, id);
  }
}
