import { forwardRef, Global, Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { SessionsModule } from '../sessions/sessions.module';
import { ProcessingService } from './processing.service';

@Global()
@Module({
  imports: [DbModule, forwardRef(() => SessionsModule)],
  providers: [ProcessingService],
  exports: [ProcessingService],
})
export class ProcessingModule {}
