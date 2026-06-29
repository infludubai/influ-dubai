import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInvitationDto {
  @IsUUID()
  creatorId: string;

  @IsOptional()
  @IsString()
  message?: string;
}
