import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from '../../../../apps/backend/src/posts/posts.service';
import { DRIZZLE } from '../../../../apps/backend/src/database/database.module';
import { LeaderboardService } from '../../../../apps/backend/src/leaderboard/leaderboard.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;
  let dbMock: any;
  let leaderboardServiceMock: any;

  beforeEach(async () => {
    dbMock = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn(),
    };

    leaderboardServiceMock = {
      broadcastUpdate: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: DRIZZLE,
          useValue: dbMock,
        },
        {
          provide: LeaderboardService,
          useValue: leaderboardServiceMock,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  describe('createPost', () => {
    it('should successfully create a post when inputs are valid', async () => {
      const mockPost = {
        id: 'post-123',
        title: 'Leverage synergy paradigm',
        content: 'This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.',
        wastedCalories: 100,
        authorId: 'user-123',
      };

      dbMock.returning.mockResolvedValue([mockPost]);

      const result = await service.createPost(
        'user-123',
        'Leverage synergy paradigm',
        'This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.',
      );

      expect(dbMock.insert).toHaveBeenCalled();
      expect(dbMock.values).toHaveBeenCalled();
      expect(dbMock.returning).toHaveBeenCalled();
      expect(leaderboardServiceMock.broadcastUpdate).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPost);
    });

    it('should throw BadRequestException if title has less than 10 characters', async () => {
      await expect(
        service.createPost('user-123', 'Short', 'This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if title lacks buzzwords', async () => {
      await expect(
        service.createPost('user-123', 'This is a normal title without jargon', 'This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if content is less than 50 characters', async () => {
      await expect(
        service.createPost('user-123', 'Leverage synergy paradigm', 'Short content.'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if content lacks buzzwords', async () => {
      await expect(
        service.createPost('user-123', 'Leverage synergy paradigm', 'This is a long content that contains absolutely zero jargon words and only normal everyday words.'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createComment', () => {
    it('should successfully create a comment when inputs are valid', async () => {
      const mockPost = {
        id: 'post-123',
        content: 'Short post content.',
      };
      const mockComment = {
        id: 'comment-123',
        postId: 'post-123',
        content: 'This comment is strictly longer than the post content. Synergy, leverage, paradigm, scale.',
        wastedCalories: 50,
        authorId: 'user-123',
      };

      dbMock.where.mockResolvedValue([mockPost]);
      dbMock.returning.mockResolvedValue([mockComment]);

      const result = await service.createComment(
        'user-123',
        'post-123',
        'This comment is strictly longer than the post content. Synergy, leverage, paradigm, scale.',
      );

      expect(dbMock.select).toHaveBeenCalled();
      expect(dbMock.insert).toHaveBeenCalled();
      expect(leaderboardServiceMock.broadcastUpdate).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockComment);
    });

    it('should throw NotFoundException if post does not exist', async () => {
      dbMock.where.mockResolvedValue([]);

      await expect(
        service.createComment('user-123', 'non-existent', 'Comment content that is long enough.'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if comment is not longer than post content', async () => {
      const mockPost = {
        id: 'post-123',
        content: 'This is post content.',
      };

      dbMock.where.mockResolvedValue([mockPost]);

      await expect(
        service.createComment('user-123', 'post-123', 'Short.'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
