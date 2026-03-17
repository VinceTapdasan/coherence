import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { CronService } from './cron.service';

@Module({
  imports: [DbModule],
  providers: [CronService],
})
export class CronModule {}
