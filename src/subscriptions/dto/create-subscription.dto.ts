import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  allowedPlans: string[];

  @ApiProperty({ default: 'NGN' })
  @IsString()
  @IsOptional()
  currency?: string;
}
