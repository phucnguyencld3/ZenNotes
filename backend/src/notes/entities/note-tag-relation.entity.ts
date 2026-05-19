// src/notes/entities/note-tag-relation.entity.ts
import {
  Entity,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { Note } from './note.entity';
import { NoteTag } from './note-tag.entity';

@Entity('note_tag_relations')
export class NoteTagRelation {
  @PrimaryColumn({ name: 'note_id', type: 'uuid' })
  noteId: string;

  @PrimaryColumn({ name: 'tag_id', type: 'uuid' })
  tagId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @ManyToOne(() => Note, (note) => note.noteTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'note_id' })
  note: Note;

  @ManyToOne(() => NoteTag, (tag) => tag.noteTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: NoteTag;
}
