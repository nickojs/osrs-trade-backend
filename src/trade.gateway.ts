import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { DataSource } from 'typeorm';
import { User } from './containers/user/entities/user.entity';
import { ConnectedUser } from './socketModel';

const STATUS = ['online', 'busy', 'away'] as const;
type UserStatusBase = typeof STATUS;
type UserStatus = UserStatusBase[number];

type ConnectedPayload = {
  id: string;
};

interface StatusPayload extends ConnectedPayload {
  status: UserStatus;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TradeGateway implements OnGatewayDisconnect {
  constructor(private dataSource: DataSource) {}

  @WebSocketServer() server: Socket;
  private connectedUsers: Partial<ConnectedUser>[] = [];

  @SubscribeMessage('afterConnect')
  setUser(client: Socket, payload: ConnectedPayload) {
    try {
      const findExistingUser = this.connectedUsers.find(
        (user) => user.userId === payload.id,
      );
      if (findExistingUser) return;

      const createSocketUser = {
        userId: payload.id,
        socketId: client.id,
      };
      this.connectedUsers.push(createSocketUser);
    } catch (error) {
      client.emit('error', "couldn't update status");
    }
  }

  async handleDisconnect(client: Socket) {
    const currentUserIndex = this.connectedUsers.findIndex(
      (user) => user.socketId === client.id,
    );
    this.connectedUsers.splice(currentUserIndex, 1);
  }

  @SubscribeMessage('setStatus')
  async setUserStatus(client: Socket, payload: StatusPayload) {
    try {
      const userRepo = this.dataSource.getRepository(User);
      const findUser = await userRepo.findOneBy({ id: payload.id });
      if (STATUS.includes(payload.status))
        if (findUser) {
          await userRepo.update(findUser, { status: payload.status });
          client.emit('setStatus', 'updated status');
        }
    } catch (error) {
      client.emit('error', "couldn't update status");
      console.log(error);
    }
  }
}
