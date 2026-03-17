import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import type { AuthedRequest } from '../auth/auth.types';
import { CalendarService } from './calendar.service';

@Controller('calendar')
@UseGuards(SupabaseAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  async getMonth(
    @Req() req: AuthedRequest,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const now = new Date();
    const parsedYear = year ? parseInt(year, 10) : now.getFullYear();
    const parsedMonth = month ? parseInt(month, 10) : now.getMonth() + 1;

    if (
      isNaN(parsedYear) ||
      isNaN(parsedMonth) ||
      parsedMonth < 1 ||
      parsedMonth > 12
    ) {
      throw new BadRequestException('Invalid year or month');
    }

    return this.calendarService.getMonthEntries(
      req.user.id,
      parsedYear,
      parsedMonth,
    );
  }

  @Get('streak')
  async getStreak(@Req() req: AuthedRequest) {
    return this.calendarService.getStreak(req.user.id);
  }
}
