import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { CreateSubscriptionDto } from '../../subscriptions/dto/create-subscription.dto';

// Pick only necessary fields from CreateGroupDto to avoid redundancy or conflicts (like subscriptionId)
class GroupDetailsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  groupName: string;

  @ApiProperty()
  @IsNotEmpty()
  groupLimit: number;

  @ApiProperty({ required: false })
  @IsString()
  rules?: string;
}

export class CreateGroupWithSubscriptionDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => CreateSubscriptionDto)
  subscriptionDetails: CreateSubscriptionDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => GroupDetailsDto)
  groupDetails: GroupDetailsDto;
}
