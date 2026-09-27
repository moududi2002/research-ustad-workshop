// backend/src/registrations/registration.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RegistrationGateway {
  @WebSocketServer()
  server: Server;

  notifyNewRegistration(data: any) {
    this.server.emit('new-registration', data);
  }
}