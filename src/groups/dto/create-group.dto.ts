import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  subscriptionId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  groupName: string;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  groupLimit: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rules?: string;
}
