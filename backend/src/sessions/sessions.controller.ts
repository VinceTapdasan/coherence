import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import type { AuthedRequest } from '../auth/auth.types';
import { ConfirmSessionDto } from './dto/confirm-session.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionsService } from './sessions.service';

@Controller('sessions')
@UseGuards(SupabaseAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('presign')
  async presign(@Req() req: AuthedRequest, @Body() dto: CreateSessionDto) {
    return this.sessionsService.createWithPresign(req.user.id, dto);
  }

  @Post(':id/confirm')
  async confirm(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: ConfirmSessionDto,
  ) {
    return this.sessionsService.confirm(id, req.user.id, dto.audioUrl);
  }

  @Get()
  async list(@Req() req: AuthedRequest) {
    return this.sessionsService.findByUser(req.user.id);
  }
}
