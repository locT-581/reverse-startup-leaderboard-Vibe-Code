import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../../apps/backend/src/auth/auth.service';
import { DRIZZLE } from '../../../../apps/backend/src/database/database.module';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';


jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let dbMock: any;
  let jwtServiceMock: any;

  beforeEach(async () => {
    dbMock = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      transaction: jest.fn().mockImplementation((cb) => cb(dbMock)),
    };

    jwtServiceMock = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DRIZZLE,
          useValue: dbMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      dbMock.limit.mockResolvedValue([]);

      const createdUser = {
        id: 'new-uuid',
        username: 'newuser',
        passwordHash: 'hashed-password',
        avatar: 'default_avatar',
        wastedCalories: 0,
        logicViolations: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dbMock.returning.mockResolvedValue([createdUser]);

      const result = await service.register('newuser', 'password123');

      expect(dbMock.select).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(dbMock.insert).toHaveBeenCalled();
      expect(jwtServiceMock.sign).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.token).toBe('mock-jwt-token');
      expect(result.data.user.username).toBe('newuser');
    });

    it('should throw BadRequestException if user already exists', async () => {
      dbMock.limit.mockResolvedValue([{ id: 'existing-id' }]);

      await expect(service.register('existinguser', 'password123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    it('should successfully log in a user with correct credentials', async () => {
      const user = {
        id: 'user-id',
        username: 'testuser',
        passwordHash: 'hashed-password',
        avatar: 'default_avatar',
        wastedCalories: 100,
        logicViolations: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dbMock.limit.mockResolvedValue([user]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('testuser', 'password123');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(result.success).toBe(true);
      expect(result.data.token).toBe('mock-jwt-token');
      expect(result.data.user.id).toBe('user-id');
    });

    it('should throw UnauthorizedException for invalid username', async () => {
      dbMock.limit.mockResolvedValue([]);

      await expect(service.login('nonexistent', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      const user = { username: 'testuser', passwordHash: 'hashed-password' };
      dbMock.limit.mockResolvedValue([user]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('testuser', 'wrongpass')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should successfully update profile username and avatar', async () => {
      dbMock.limit.mockResolvedValue([]);

      const updatedUser = {
        id: 'user-id',
        username: 'newusername',
        passwordHash: 'hashed-password',
        avatar: 'avatar_clown',
        wastedCalories: 100,
        logicViolations: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dbMock.returning.mockResolvedValue([updatedUser]);

      const result = await service.updateProfile('user-id', 'newusername', 'avatar_clown');

      expect(dbMock.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.username).toBe('newusername');
      expect(result.data.avatar).toBe('avatar_clown');
    });
  });

  describe('updateMercy', () => {
    it('should successfully update mercy failures and isMercyActive status', async () => {
      const updatedUser = {
        id: 'user-id',
        username: 'testuser',
        passwordHash: 'hashed-password',
        avatar: 'default_avatar',
        wastedCalories: 100,
        logicViolations: 2,
        mercyFailures: 5,
        isMercyActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dbMock.returning.mockResolvedValue([updatedUser]);

      const result = await service.updateMercy('user-id', 5, true);

      expect(dbMock.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.mercyFailures).toBe(5);
      expect(result.data.isMercyActive).toBe(true);
    });
  });
});
