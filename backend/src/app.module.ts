import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { CalendarModule } from './calendar/calendar.module';
import { CronModule } from './cron/cron.module';
import { DbModule } from './db/db.module';
import { ProcessingModule } from './processing/processing.module';
import { ResultsModule } from './results/results.module';
import { SessionsModule } from './sessions/sessions.module';
import { SupabaseModule } from './supabase/supabase.module';
import { UsersModule } from './users/users.module';
import { WordsModule } from './words/words.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DbModule,
    SupabaseModule,
    AuthModule,
    ProcessingModule,
    UsersModule,
    WordsModule,
    SessionsModule,
    ResultsModule,
    CalendarModule,
    CronModule,
  ],
})
export class AppModule {}
