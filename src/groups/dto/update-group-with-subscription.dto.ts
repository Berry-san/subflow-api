import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { UpdateSubscriptionDto } from 'src/subscriptions/dto/update-subscription.dto';
import { UpdateGroupDto } from './update-group.dto';

export class UpdateGroupWithSubscriptionDto {
  @ApiProperty({ required: false })
  @ValidateNested()
  @IsOptional()
  @Type(() => UpdateSubscriptionDto)
  subscriptionDetails?: UpdateSubscriptionDto;

  @ApiProperty({ required: false })
  @ValidateNested()
  @IsOptional()
  @Type(() => UpdateGroupDto)
  groupDetails?: UpdateGroupDto;
}
