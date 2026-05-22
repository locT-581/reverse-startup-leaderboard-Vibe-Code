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
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      transaction: jest.fn((cb) => cb(dbMock)),
      for: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
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

  describe('vote', () => {
    const userId = '11111111-1111-1111-1111-111111111111';
    const authorId = '22222222-2222-2222-2222-222222222222';
    const postId = '33333333-3333-3333-3333-333333333333';
    const commentId = '44444444-4444-4444-4444-444444444444';

    it('should successfully increment post wasted calories by 50', async () => {
      const mockPost = {
        id: postId,
        title: 'Mock Post',
        wastedCalories: 100,
        authorId: authorId,
      };
      const mockUpdatedPost = {
        ...mockPost,
        wastedCalories: 150,
      };

      // first select
      dbMock.where.mockResolvedValueOnce([mockPost]);
      // then update chain
      dbMock.where.mockReturnThis();
      dbMock.returning.mockResolvedValueOnce([mockUpdatedPost]);

      const result = await service.vote(userId, postId, 'post');

      expect(dbMock.select).toHaveBeenCalled();
      expect(dbMock.update).toHaveBeenCalled();
      expect(dbMock.set).toHaveBeenCalledWith({ wastedCalories: expect.any(Object) });
      expect(leaderboardServiceMock.broadcastUpdate).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.wastedCalories).toBe(150);
    });

    it('should successfully increment comment wasted calories by 50', async () => {
      const mockComment = {
        id: commentId,
        content: 'Mock Comment',
        wastedCalories: 200,
        authorId: authorId,
      };
      const mockUpdatedComment = {
        ...mockComment,
        wastedCalories: 250,
      };

      // first select
      dbMock.where.mockResolvedValueOnce([mockComment]);
      // then update chain
      dbMock.where.mockReturnThis();
      dbMock.returning.mockResolvedValueOnce([mockUpdatedComment]);

      const result = await service.vote(userId, commentId, 'comment');

      expect(dbMock.select).toHaveBeenCalled();
      expect(dbMock.update).toHaveBeenCalled();
      expect(dbMock.set).toHaveBeenCalledWith({ wastedCalories: expect.any(Object) });
      expect(leaderboardServiceMock.broadcastUpdate).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.wastedCalories).toBe(250);
    });

    it('should throw BadRequestException if targetId is not a valid UUID', async () => {
      await expect(
        service.vote(userId, 'invalid-uuid', 'post')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user tries to vote on their own post', async () => {
      const mockPost = {
        id: postId,
        title: 'Mock Post',
        wastedCalories: 100,
        authorId: userId, // self-voting
      };

      dbMock.where.mockResolvedValueOnce([mockPost]);

      await expect(
        service.vote(userId, postId, 'post')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user tries to vote on their own comment', async () => {
      const mockComment = {
        id: commentId,
        content: 'Mock Comment',
        wastedCalories: 200,
        authorId: userId, // self-voting
      };

      dbMock.where.mockResolvedValueOnce([mockComment]);

      await expect(
        service.vote(userId, commentId, 'comment')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if post target is not found', async () => {
      dbMock.where.mockResolvedValueOnce([]);

      await expect(
        service.vote(userId, postId, 'post')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if comment target is not found', async () => {
      dbMock.where.mockResolvedValueOnce([]);

      await expect(
        service.vote(userId, commentId, 'comment')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reportPost', () => {
    const userId = '11111111-1111-1111-1111-111111111111';
    const authorId = '22222222-2222-2222-2222-222222222222';
    const postId = '33333333-3333-3333-3333-333333333333';

    it('should successfully report a post, incrementing author logicViolations by 1', async () => {
      const mockPost = {
        id: postId,
        title: 'Leverage synergy paradigm',
        authorId: authorId,
      };
      const mockUpdatedUser = {
        id: authorId,
        username: 'alice',
        logicViolations: 5,
      };

      // Mock select post
      dbMock.limit.mockResolvedValueOnce([mockPost]);
      // Mock update user chain
      dbMock.returning.mockResolvedValueOnce([mockUpdatedUser]);

      const result = await service.reportPost(userId, postId);

      expect(dbMock.select).toHaveBeenCalled();
      expect(dbMock.update).toHaveBeenCalled();
      expect(dbMock.set).toHaveBeenCalledWith({
        logicViolations: expect.any(Object),
        updatedAt: expect.any(Date),
      });
      expect(leaderboardServiceMock.broadcastUpdate).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        postId,
        authorId: authorId,
        logicViolations: 5,
      });
    });

    it('should throw NotFoundException if post does not exist', async () => {
      dbMock.limit.mockResolvedValueOnce([]);

      await expect(
        service.reportPost(userId, postId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user tries to report their own post', async () => {
      const mockPost = {
        id: postId,
        title: 'Mock Post',
        authorId: userId, // self
      };

      dbMock.limit.mockResolvedValueOnce([mockPost]);

      await expect(
        service.reportPost(userId, postId)
      ).rejects.toThrow(BadRequestException);
    });
  });
});
