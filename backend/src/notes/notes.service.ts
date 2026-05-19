import { Injectable, NotFoundException } from '@nestjs/common';
import type { Note } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteDto } from './dto/note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateNoteDto): Promise<NoteDto> {
    const note = await this.prisma.note.create({
      data: {
        title: dto.title,
        content: dto.content,
        userId,
      },
    });

    if (dto.tags && dto.tags.length > 0) {
      for (const tagName of dto.tags) {
        const cleanTagName = tagName.trim().toLowerCase();
        if (!cleanTagName) continue;

        const tag = await this.prisma.noteTag.upsert({
          where: { name: cleanTagName },
          update: {},
          create: { name: cleanTagName },
        });

        await this.prisma.noteTagRelation.create({
          data: {
            noteId: note.id,
            tagId: tag.id,
          },
        });
      }
    }

    return this.findOneByUser(note.id, userId);
  }

  async findAllByUser(userId: string): Promise<NoteDto[]> {
    const notes = await this.prisma.note.findMany({
      where: { userId },
      include: {
        noteTags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return notes.map((note) => this.toDto(note));
  }

  async findOneByUser(id: string, userId: string): Promise<NoteDto> {
    const note = await this.prisma.note.findFirst({
      where: { id, userId },
      include: {
        noteTags: {
          include: {
            tag: true,
          },
        },
      },
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

    await this.prisma.note.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
      },
    });

    if (dto.tags !== undefined) {
      // Clear existing relations
      await this.prisma.noteTagRelation.deleteMany({
        where: { noteId: id },
      });

      // Link new tags
      if (dto.tags && dto.tags.length > 0) {
        for (const tagName of dto.tags) {
          const cleanTagName = tagName.trim().toLowerCase();
          if (!cleanTagName) continue;

          const tag = await this.prisma.noteTag.upsert({
            where: { name: cleanTagName },
            update: {},
            create: { name: cleanTagName },
          });

          await this.prisma.noteTagRelation.create({
            data: {
              noteId: id,
              tagId: tag.id,
            },
          });
        }
      }
    }

    return this.findOneByUser(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.ensureOwnership(id, userId);
    await this.prisma.note.delete({ where: { id } });
  }

  private async ensureOwnership(id: string, userId: string): Promise<void> {
    const exists = await this.prisma.note.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!exists) throw new NotFoundException('Note not found');
  }

  private toDto(note: any): NoteDto {
    const dto = new NoteDto();
    dto.id = note.id;
    dto.title = note.title;
    dto.content = note.content;
    dto.userId = note.userId;
    dto.createdAt = note.createdAt;
    dto.updatedAt = note.updatedAt;
    const dbTags = note.noteTags
      ? note.noteTags.map((nt: any) => nt.tag.name)
      : [];
    dto.tags = dbTags.length > 0 ? dbTags : ['khác'];
    return dto;
  }

  async findAllTagsByUser(userId: string): Promise<string[]> {
    const tags = await this.prisma.noteTag.findMany({
      select: {
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return tags.map((t) => t.name);
  }
}
