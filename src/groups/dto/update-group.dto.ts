import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateGroupDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  groupName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  groupLimit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rules?: string;
}