import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({
    description: 'User id (UUID) (maps to users.id)',
    example: '3f2d3a3b-1c1f-4bdb-9b70-61fcd3f0e3e1',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'User full name (maps to users.full_name)',
    example: 'Nguyen Van A',
  })
  fullName!: string;

  @ApiProperty({
    description: 'User email (maps to users.email)',
    example: 'user@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Created timestamp (maps to users.created_at)',
    example: '2026-05-18T10:20:30.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Updated timestamp (maps to users.updated_at)',
    example: '2026-05-18T10:20:30.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt!: Date;
}
