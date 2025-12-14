import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional } from 'class-validator';

export enum PaymentPlan {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUAL = 'SEMI_ANNUAL',
  ANNUAL = 'ANNUAL',
}

export class CreateGroupPaymentDto {
  @ApiProperty({ enum: PaymentPlan })
  @IsEnum(PaymentPlan)
  plan: PaymentPlan;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsDateString()
  dueDate: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  gracePeriodDays?: number;
}
