import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardGateway } from '../../../../apps/backend/src/leaderboard/leaderboard.gateway';
import { LeaderboardService } from '../../../../apps/backend/src/leaderboard/leaderboard.service';

describe('LeaderboardGateway', () => {
  let gateway: LeaderboardGateway;
  let serviceMock: any;
  let clientMock: any;
  let serverMock: any;

  beforeEach(async () => {
    serviceMock = {
      getLeaderboard: jest.fn().mockResolvedValue({
        success: true,
        data: [
          {
            id: 'post-1',
            title: 'Post 1',
            content: 'Standard content',
            wastedCalories: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
            author: { id: 'user-1', username: 'alice', avatar: 'avatar1' },
          },
        ],
      }),
    };

    clientMock = {
      emit: jest.fn(),
    };

    serverMock = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardGateway,
        {
          provide: LeaderboardService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    gateway = module.get<LeaderboardGateway>(LeaderboardGateway);
    gateway.server = serverMock;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should fetch leaderboard and emit updated data to the connecting client', async () => {
      await gateway.handleConnection(clientMock);

      expect(serviceMock.getLeaderboard).toHaveBeenCalled();
      expect(clientMock.emit).toHaveBeenCalledWith('leaderboard.updated', expect.any(Array));
    });
  });

  describe('broadcastLeaderboard', () => {
    it('should fetch leaderboard and emit updated data to all connected clients', async () => {
      await gateway.broadcastLeaderboard();

      expect(serviceMock.getLeaderboard).toHaveBeenCalled();
      expect(serverMock.emit).toHaveBeenCalledWith('leaderboard.updated', expect.any(Array));
    });
  });
});
