import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NoteDto {
  @ApiProperty({
    description: 'Note id (UUID) (maps to notes.id)',
    example: 'd3aa1c70-3f8b-4d7c-a6b1-1a2f88f4c5a9',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'Note title (maps to notes.title)',
    example: 'My first note',
  })
  title!: string;

  @ApiPropertyOptional({
    description: 'Note content (maps to notes.content)',
    example: 'Some details...',
  })
  content?: string | null;

  @ApiProperty({
    description: 'Owner user id (UUID) (maps to notes.user_id)',
    example: '3f2d3a3b-1c1f-4bdb-9b70-61fcd3f0e3e1',
    format: 'uuid',
  })
  userId!: string;

  @ApiProperty({
    description: 'Created timestamp (maps to notes.created_at)',
    example: '2026-05-18T10:20:30.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Updated timestamp (maps to notes.updated_at)',
    example: '2026-05-18T10:20:30.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt!: Date;

  @ApiProperty({
    description: 'List of tag names linked to this note',
    example: ['work', 'personal'],
    type: [String],
  })
  tags!: string[];
}
