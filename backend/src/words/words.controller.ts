import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import type { AuthedRequest } from '../auth/auth.types';
import { WordsService } from './words.service';

@Controller('words')
@UseGuards(SupabaseAuthGuard)
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  @Get('daily')
  async getDaily(@Req() req: AuthedRequest) {
    return this.wordsService.getDailyWord(req.user.id);
  }

  @Get('practice')
  async getPractice(
    @Req() req: AuthedRequest,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.wordsService.getPracticeWords(req.user.id, parsedLimit);
  }
}
