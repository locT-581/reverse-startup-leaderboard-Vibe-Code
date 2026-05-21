import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SabotageController } from './sabotage.controller';
import { SabotageService } from './sabotage.service';
import { StripeService } from './stripe.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SabotageController],
  providers: [SabotageService, StripeService],
  exports: [SabotageService, StripeService],
})
export class SabotageModule {}
