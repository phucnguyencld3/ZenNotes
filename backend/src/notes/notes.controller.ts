import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserDto } from '../users/dto/user.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteDto } from './dto/note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesService } from './notes.service';

type AuthenticatedRequest = { user: UserDto };

@ApiTags('notes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notes')
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create note' })
  @ApiBody({ type: CreateNoteDto })
  @ApiResponse({ status: 201, type: NoteDto })
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateNoteDto,
  ): Promise<NoteDto> {
    return this.notesService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my notes' })
  @ApiResponse({ status: 200, type: [NoteDto] })
  findAll(@Req() req: AuthenticatedRequest): Promise<NoteDto[]> {
    return this.notesService.findAllByUser(req.user.id);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all tags used by the user' })
  @ApiResponse({ status: 200, type: [String] })
  findAllTags(@Req() req: AuthenticatedRequest): Promise<string[]> {
    return this.notesService.findAllTagsByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one note by id' })
  @ApiResponse({ status: 200, type: NoteDto })
  @ApiResponse({ status: 404, description: 'Note not found' })
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<NoteDto> {
    return this.notesService.findOneByUser(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update note' })
  @ApiBody({ type: UpdateNoteDto })
  @ApiResponse({ status: 200, type: NoteDto })
  @ApiResponse({ status: 404, description: 'Note not found' })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ): Promise<NoteDto> {
    return this.notesService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete note' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.notesService.remove(id, req.user.id);
    return { message: 'Deleted successfully' };
  }
}
