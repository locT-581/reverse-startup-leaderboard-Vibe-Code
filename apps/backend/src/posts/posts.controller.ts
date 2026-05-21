import { Controller, Post, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPost(@Request() req: any, @Body() body: { title?: string; content?: string }) {
    if (!body.title || !body.content) {
      throw new BadRequestException({
        success: false,
        error: { message: 'Title and content are required.' },
      });
    }
    return this.postsService.createPost(req.user.sub, body.title, body.content);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async createComment(
    @Request() req: any,
    @Param('id') postId: string,
    @Body() body: { content?: string },
  ) {
    if (!body.content) {
      throw new BadRequestException({
        success: false,
        error: { message: 'Content is required.' },
      });
    }
    return this.postsService.createComment(req.user.sub, postId, body.content);
  }

  @UseGuards(JwtAuthGuard)
  @Post('vote')
  async vote(
    @Request() req: any,
    @Body() body: { targetId?: string; targetType?: 'post' | 'comment' },
  ) {
    if (!body.targetId || !body.targetType) {
      throw new BadRequestException({
        success: false,
        error: { message: 'targetId and targetType are required.' },
      });
    }
    if (body.targetType !== 'post' && body.targetType !== 'comment') {
      throw new BadRequestException({
        success: false,
        error: { message: 'targetType must be post or comment.' },
      });
    }
    return this.postsService.vote(req.user.sub, body.targetId, body.targetType);
  }
}
