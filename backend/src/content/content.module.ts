import { Global, Module } from '@nestjs/common';
import {
  AdminContentController,
  PublicContentController,
} from './content.controller';
import { ContentService } from './content.service';

/** Global so billing can read admin-edited plan pricing. */
@Global()
@Module({
  controllers: [PublicContentController, AdminContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
