import { Controller, Post, Body, Get, Put, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() body: { username?: string; password?: string }) {
    return this.authService.register(body.username ?? '', body.password ?? '');
  }

  @Post('login')
  async login(@Body() body: { username?: string; password?: string }) {
    return this.authService.login(body.username ?? '', body.password ?? '');
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Request() req: any) {
    return this.authService.validateUser(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req: any, @Body() body: { username?: string; avatar?: string }) {
    return this.authService.updateProfile(req.user.sub, body.username ?? '', body.avatar ?? '');
  }

  @UseGuards(JwtAuthGuard)
  @Put('mercy')
  async updateMercy(@Request() req: any, @Body() body: { failures?: number; isMercyActive?: boolean }) {
    return this.authService.updateMercy(
      req.user.sub,
      body.failures ?? 0,
      body.isMercyActive ?? false
    );
  }
}
