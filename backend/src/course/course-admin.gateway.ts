
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Namespace, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';

const ADMIN_ROOM = 'course-admin-authorized';

@WebSocketGateway({
  namespace: '/course-admin',
  cors: {
    origin: [
      'https://workshop.researchustad.org',
      'http://localhost:3000',
      'http://localhost:3003',
    ],
    credentials: true,
  },
})
export class CourseAdminGateway
  implements OnGatewayConnection
{
  @WebSocketServer()
  server!: Namespace;

  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  private readCookie(
    header: string,
    name: string,
  ): string | null {
    const entry = header
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`));

    if (!entry) return null;

    try {
      return decodeURIComponent(
        entry.slice(name.length + 1),
      );
    } catch {
      return null;
    }
  }

  async handleConnection(client: Socket) {
    try {
      const origin = client.handshake.headers.origin;

      const allowedOrigins = [
        'https://workshop.researchustad.org',
        'http://localhost:3000',
        'http://localhost:3003',
      ];

      if (!origin || !allowedOrigins.includes(origin)) {
        client.disconnect(true);
        return;
      }

      const token = this.readCookie(
        String(client.handshake.headers.cookie || ''),
        'access_token',
      );

      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<{
        sub: string;
      }>(token);

      if (!payload?.sub) {
        client.disconnect(true);
        return;
      }

      const admin = await this.authService.findById(
        payload.sub,
      );

      if (!admin || !admin.isActive) {
        client.disconnect(true);
        return;
      }

      await client.join(ADMIN_ROOM);

      console.log(
        '[Course WS] Authorized admin connected',
      );
    } catch {
      client.disconnect(true);
    }
  }

  notifyChange() {
    if (!this.server) return;

    this.server.to(ADMIN_ROOM).emit('course:changed', {
      at: Date.now(),
    });
  }
}
