import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { PostsModule } from './posts/posts.module';
import { SabotageModule } from './sabotage/sabotage.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    LeaderboardModule,
    PostsModule,
    SabotageModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
