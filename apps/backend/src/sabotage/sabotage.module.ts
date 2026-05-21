import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SabotageController } from './sabotage.controller';
import { SabotageService } from './sabotage.service';
import { StripeService } from './stripe.service';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => LeaderboardModule)],
  controllers: [SabotageController],
  providers: [SabotageService, StripeService],
  exports: [SabotageService, StripeService],
})
export class SabotageModule {}
