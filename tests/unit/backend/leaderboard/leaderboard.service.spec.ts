import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardService } from '../../../../apps/backend/src/leaderboard/leaderboard.service';
import { DRIZZLE } from '../../../../apps/backend/src/database/database.module';
import { LeaderboardGateway } from '../../../../apps/backend/src/leaderboard/leaderboard.gateway';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let dbMock: any;
  let gatewayMock: any;

  beforeEach(async () => {
    dbMock = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn(),
    };

    gatewayMock = {
      broadcastLeaderboard: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        {
          provide: DRIZZLE,
          useValue: dbMock,
        },
        {
          provide: LeaderboardGateway,
          useValue: gatewayMock,
        },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
  });

  describe('calculateScore', () => {
    it('should calculate score for a standard post (word count only)', () => {
      // 20 words, length = 125 (no modifier), no scream, no code, no punctuation
      const content = 'This is a standard text post with exactly twenty words. We are writing normal sentences without any special characters here.';
      const score = service.calculateScore(content);
      // 20 * 5 = 100
      expect(score).toBe(100);
    });

    it('should apply word count and less than 100 characters modifier (-50)', () => {
      // 2 words, length = 12 (< 100 => -50)
      const content = 'Hello world.';
      const score = service.calculateScore(content);
      // 2 * 5 - 50 = -40
      expect(score).toBe(-40);
    });

    it('should apply word count and greater than 1000 characters modifier (+150)', () => {
      // Create a string with length > 1000 containing 210 words
      const word = 'word ';
      const content = word.repeat(210); // 210 words, length = 1050
      const score = service.calculateScore(content);
      // 210 * 5 + 150 = 1050 + 150 = 1200
      expect(score).toBe(1200);
    });

    it('should apply capitalization scream penalty (+50)', () => {
      // 10 words, length = 60 (< 100 => -50), > 30% uppercase (100% here)
      const content = 'THIS IS A SCREAMING MESSAGE FOR ALL TEAM MEMBERS TO READ.';
      const score = service.calculateScore(content);
      // 11 words: 'THIS', 'IS', 'A', 'SCREAMING', 'MESSAGE', 'FOR', 'ALL', 'TEAM', 'MEMBERS', 'TO', 'READ.'
      // 11 * 5 - 50 + 50 (scream) = 55
      expect(score).toBe(55);
    });

    it('should not apply capitalization scream penalty if <= 30% uppercase', () => {
      // 10 words, length = 54 (< 100 => -50), few uppercase chars (only 2 out of ~45 => < 30%)
      const content = 'This is a normal message for all team members to read.';
      const score = service.calculateScore(content);
      // 11 words * 5 = 55
      // 55 - 50 = 5
      expect(score).toBe(5);
    });

    it('should apply over-engineering code block penalty (+100)', () => {
      const content = 'Check out our clean architecture: \n```typescript\nconst add = (a: number, b: number) => a + b;\n```\nIt is extremely clean, scalable, and beautifully designed for enterprise use.';
      const score = service.calculateScore(content);
      // Length: 180 (no modifier)
      // Words count: 29 words
      // Score: 29 * 5 + 100 (code) = 245
      expect(score).toBe(245);
    });

    it('should apply frustration punctuation points (+5 per occurrence, capped at +50)', () => {
      const content = 'Why did the server crash?! Oh no! We need to check the logs... asap. Please help us fix this now because we are running out of time!';
      const score = service.calculateScore(content);
      // Punctuation: ?, !, !, ..., ! = 5 occurrences => +25
      // Words: 27
      // 27 * 5 + 25 = 160
      expect(score).toBe(160);
    });

    it('should cap frustration punctuation points at +50', () => {
      const content = 'FAIL!!! WHY?! OH?! NO!!! CODE!!! HELP!!! NEED BACKUP!!! NOW!!! WE ARE DOOMED!!!';
      const score = service.calculateScore(content);
      // Length: 81 (< 100 => -50)
      // Scream: 100% scream => +50
      // Punctuation: > 10 => +50
      // Words: 12
      // 12 * 5 - 50 + 50 + 50 = 110
      expect(score).toBe(110);
    });

    it('should return 0 when content is empty, null, or undefined', () => {
      expect(service.calculateScore('')).toBe(0);
      expect(service.calculateScore(null as any)).toBe(0);
      expect(service.calculateScore(undefined as any)).toBe(0);
    });
  });

  describe('getLeaderboard', () => {
    it('should return posts sorted descending by calculated score', async () => {
      // Mock DB returning 3 raw posts
      const mockRawPosts = [
        {
          id: 'post-1',
          title: 'Post 1',
          content: 'Hello world.', // score: 2 * 5 - 50 = -40
          createdAt: new Date(),
          updatedAt: new Date(),
          author: { id: 'user-1', username: 'alice', avatar: 'avatar1' },
        },
        {
          id: 'post-2',
          title: 'Post 2',
          content: 'Check out our clean architecture: \n```typescript\nconst add = (a: number, b: number) => a + b;\n```\nIt is extremely clean, scalable, and beautifully designed for enterprise use.', // score: 245
          createdAt: new Date(),
          updatedAt: new Date(),
          author: { id: 'user-2', username: 'bob', avatar: 'avatar2' },
        },
        {
          id: 'post-3',
          title: 'Post 3',
          content: 'THIS IS A SCREAMING MESSAGE FOR ALL TEAM MEMBERS TO READ.', // score: 55
          createdAt: new Date(),
          updatedAt: new Date(),
          author: { id: 'user-3', username: 'charlie', avatar: 'avatar3' },
        },
      ];

      dbMock.innerJoin.mockResolvedValue(mockRawPosts);

      const result = await service.getLeaderboard();

      expect(dbMock.select).toHaveBeenCalled();
      expect(dbMock.from).toHaveBeenCalled();
      expect(dbMock.innerJoin).toHaveBeenCalled();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);

      // Should be sorted: Post 2 (245) -> Post 3 (55) -> Post 1 (-40)
      expect(result.data[0].id).toBe('post-2');
      expect(result.data[0].wastedCalories).toBe(245);

      expect(result.data[1].id).toBe('post-3');
      expect(result.data[1].wastedCalories).toBe(55);

      expect(result.data[2].id).toBe('post-1');
      expect(result.data[2].wastedCalories).toBe(-40);
    });

    it('should fall back to stable sorting on createdAt descending when score is equal', async () => {
      const now = new Date();
      const mockRawPosts = [
        {
          id: 'post-older',
          title: 'Older Post',
          content: 'Hello world.', // score: -40
          createdAt: new Date(now.getTime() - 10000), // Older
          updatedAt: new Date(),
          author: { id: 'user-1', username: 'alice', avatar: 'avatar1' },
        },
        {
          id: 'post-newer',
          title: 'Newer Post',
          content: 'Hello world.', // score: -40
          createdAt: now, // Newer
          updatedAt: new Date(),
          author: { id: 'user-2', username: 'bob', avatar: 'avatar2' },
        },
      ];

      dbMock.innerJoin.mockResolvedValue(mockRawPosts);

      const result = await service.getLeaderboard();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);

      // Newer post should come first (stable sub-sort)
      expect(result.data[0].id).toBe('post-newer');
      expect(result.data[1].id).toBe('post-older');
    });
  });
});
