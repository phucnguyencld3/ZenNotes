// src/notes/entities/note-tag.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { NoteTagRelation } from './note-tag-relation.entity';

@Entity('note_tags')
export class NoteTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @OneToMany(() => NoteTagRelation, (noteTagRelation) => noteTagRelation.tag)
  noteTags: NoteTagRelation[];
}
