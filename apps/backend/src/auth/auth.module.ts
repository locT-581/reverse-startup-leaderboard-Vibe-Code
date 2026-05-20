import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '../database/database.module';

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;

if (isProduction && !jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required in production! Security boundary violation.');
}

const secret = jwtSecret || 'fallback-secret-for-development-only-12345';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      global: true,
      secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
