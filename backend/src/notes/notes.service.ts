import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './entities/note.entity';
import { NoteTag } from './entities/note-tag.entity';
import { NoteTagRelation } from './entities/note-tag-relation.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteDto } from './dto/note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private notesRepository: Repository<Note>,
    @InjectRepository(NoteTag)
    private noteTagsRepository: Repository<NoteTag>,
    @InjectRepository(NoteTagRelation)
    private noteTagRelationsRepository: Repository<NoteTagRelation>,
  ) {}

  async create(userId: string, dto: CreateNoteDto): Promise<NoteDto> {
    const note = this.notesRepository.create({
      title: dto.title,
      content: dto.content,
      userId,
    });
    await this.notesRepository.save(note);

    if (dto.tags && dto.tags.length > 0) {
      for (const tagName of dto.tags) {
        const cleanTagName = tagName.trim().toLowerCase();
        if (!cleanTagName) continue;

        let tag = await this.noteTagsRepository.findOne({ where: { name: cleanTagName } });
        if (!tag) {
          tag = this.noteTagsRepository.create({ name: cleanTagName });
          await this.noteTagsRepository.save(tag);
        }

        const relation = this.noteTagRelationsRepository.create({
          noteId: note.id,
          tagId: tag.id,
        });
        await this.noteTagRelationsRepository.save(relation);
      }
    }

    return this.findOneByUser(note.id, userId);
  }

  async findAllByUser(userId: string): Promise<NoteDto[]> {
    const notes = await this.notesRepository.find({
      where: { userId },
      relations: ['noteTags', 'noteTags.tag'],
      order: { updatedAt: 'DESC' },
    });

    return notes.map((note) => this.toDto(note));
  }

  async findOneByUser(id: string, userId: string): Promise<NoteDto> {
    const note = await this.notesRepository.findOne({
      where: { id, userId },
      relations: ['noteTags', 'noteTags.tag'],
    });

    if (!note) throw new NotFoundException('Note not found');
    return this.toDto(note);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateNoteDto,
  ): Promise<NoteDto> {
    await this.ensureOwnership(id, userId);

    await this.notesRepository.update({ id }, {
      title: dto.title,
      content: dto.content,
    });

    if (dto.tags !== undefined) {
      // Clear existing relations
      await this.noteTagRelationsRepository.delete({ noteId: id });

      // Link new tags
      if (dto.tags && dto.tags.length > 0) {
        for (const tagName of dto.tags) {
          const cleanTagName = tagName.trim().toLowerCase();
          if (!cleanTagName) continue;

          let tag = await this.noteTagsRepository.findOne({ where: { name: cleanTagName } });
          if (!tag) {
            tag = this.noteTagsRepository.create({ name: cleanTagName });
            await this.noteTagsRepository.save(tag);
          }

          const relation = this.noteTagRelationsRepository.create({
            noteId: id,
            tagId: tag.id,
          });
          await this.noteTagRelationsRepository.save(relation);
        }
      }
    }

    return this.findOneByUser(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.ensureOwnership(id, userId);
    await this.notesRepository.delete({ id });
  }

  private async ensureOwnership(id: string, userId: string): Promise<void> {
    const exists = await this.notesRepository.findOne({
      where: { id, userId },
      select: ['id'],
    });

    if (!exists) throw new NotFoundException('Note not found');
  }

  private toDto(note: Note): NoteDto {
    const dto = new NoteDto();
    dto.id = note.id;
    dto.title = note.title;
    dto.content = note.content;
    dto.userId = note.userId;
    dto.createdAt = note.createdAt;
    dto.updatedAt = note.updatedAt;
    const dbTags = note.noteTags
      ? note.noteTags.map((nt) => nt.tag?.name).filter(Boolean) as string[]
      : [];
    dto.tags = dbTags.length > 0 ? dbTags : ['khác'];
    return dto;
  }

  async findAllTagsByUser(userId: string): Promise<string[]> {
    const tags = await this.noteTagsRepository.find({
      select: ['name'],
      order: { name: 'ASC' },
    });
    return tags.map((t) => t.name);
  }
}
