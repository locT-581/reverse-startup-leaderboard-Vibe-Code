import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [DatabaseModule, LeaderboardModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule { }
