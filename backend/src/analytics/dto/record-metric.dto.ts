import { IsInt, IsOptional, Min } from 'class-validator';

export class RecordMetricDto {
  @IsInt() @Min(0) reach: number;
  @IsInt() @Min(0) impressions: number;
  @IsInt() @Min(0) engagement: number;
  @IsInt() @Min(0) clicks: number;
  @IsInt() @Min(0) conversions: number;
}
