import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({
    description: 'Note title (maps to notes.title)',
    example: 'My first note',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({
    description: 'Note content (maps to notes.content)',
    example: 'Some details...',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'Array of tag names associated with this note',
    example: ['work', 'personal'],
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
