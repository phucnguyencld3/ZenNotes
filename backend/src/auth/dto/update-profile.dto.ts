import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Nguyen Van A', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  fullName!: string;
}
