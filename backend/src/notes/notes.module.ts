import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { Note } from './entities/note.entity';
import { NoteTag } from './entities/note-tag.entity';
import { NoteTagRelation } from './entities/note-tag-relation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Note, NoteTag, NoteTagRelation])],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
