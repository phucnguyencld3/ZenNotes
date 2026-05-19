import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User full name (maps to users.full_name)',
    example: 'Nguyen Van A',
    maxLength: 255,
  })
  fullName!: string;

  @ApiProperty({
    description: 'User email (maps to users.email)',
    example: 'user@example.com',
    maxLength: 255,
  })
  email!: string;

  @ApiProperty({
    description:
      'User password hash/plain depending on implementation (maps to users.password)',
    example: 'P@ssw0rd123',
    maxLength: 255,
  })
  password!: string;
}
