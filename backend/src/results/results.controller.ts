import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import type { AuthedRequest } from '../auth/auth.types';
import { ResultsService } from './results.service';

@Controller('results')
@UseGuards(SupabaseAuthGuard)
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get()
  async getRecent(
    @Req() req: AuthedRequest,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.resultsService.findRecent(req.user.id, parsedLimit);
  }

  @Get(':sessionId')
  async getBySession(
    @Req() req: AuthedRequest,
    @Param('sessionId') sessionId: string,
  ) {
    return this.resultsService.findBySession(sessionId, req.user.id);
  }
}
