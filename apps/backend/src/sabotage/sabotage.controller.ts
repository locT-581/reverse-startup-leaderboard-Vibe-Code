import { Controller, Get, Post, Body, Req, UseGuards, Headers, UnauthorizedException } from '@nestjs/common';
import { SabotageService } from './sabotage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sabotage')
export class SabotageController {
  constructor(private readonly sabotageService: SabotageService) {}

  @UseGuards(JwtAuthGuard)
  @Get('packs')
  async getAvailablePacks() {
    return this.sabotageService.getAvailablePacks();
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async createCheckoutSession(@Req() req: any, @Body('packId') packId: string) {
    const userId = req.user.sub;
    return this.sabotageService.createCheckoutSession(userId, packId);
  }

  @Post('fulfill')
  async fulfillPurchase(
    @Headers('x-webhook-secret') webhookSecret: string,
    @Body() body: { sessionId: string; userId: string; packId: string },
  ) {
    const expectedSecret = process.env.JWT_SECRET;
    if (!webhookSecret || webhookSecret !== expectedSecret) {
      throw new UnauthorizedException({
        success: false,
        error: { message: 'Unauthorized webhook call.' },
      });
    }

    return this.sabotageService.fulfillPurchase(
      body.sessionId,
      body.userId,
      body.packId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('inventory')
  async getUserInventory(@Req() req: any) {
    const userId = req.user.sub;
    return this.sabotageService.getUserInventory(userId);
  }
}
