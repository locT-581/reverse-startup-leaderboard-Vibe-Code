import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LeaderboardService } from './leaderboard.service';
import { forwardRef, Inject, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class LeaderboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(LeaderboardGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => LeaderboardService))
    private readonly leaderboardService: LeaderboardService,
  ) { }

  async handleConnection(client: Socket) {
    try {
      const leaderboard = await this.leaderboardService.getLeaderboard();
      client.emit('leaderboard.updated', leaderboard.data);
    } catch (err) {
      this.logger.error(`Error sending initial leaderboard on connection: ${err.message}`, err.stack);
    }
  }

  handleDisconnect(client: Socket) { }

  async broadcastLeaderboard() {
    if (!this.server) return;
    try {
      const leaderboard = await this.leaderboardService.getLeaderboard();
      this.server.emit('leaderboard.updated', leaderboard.data);
    } catch (err) {
      this.logger.error(`Error broadcasting leaderboard: ${err.message}`, err.stack);
    }
  }
}
