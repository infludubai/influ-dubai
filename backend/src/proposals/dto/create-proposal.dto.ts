import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProposalDto {
  @IsString()
  coverLetter: string;

  @IsOptional()
  @IsNumber()
  proposedRate?: number;
}
