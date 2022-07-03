import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayDisconnect,
  OnGatewayConnection,
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
  userId: string;
  username: string;
};

interface StatusPayload extends ConnectedPayload {
  status: UserStatus;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TradeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private dataSource: DataSource) {}

  private connectedUserFactory(
    userId: string,
    username: string,
    socketId: string,
  ): ConnectedUser {
    return {
      userId,
      socketId,
      username,
      trading: {
        isTrading: false,
        recipientId: '',
      },
      acceptTrade: false,
      sendingItems: [],
      receivingItems: [],
    };
  }

  @WebSocketServer() server: Socket;
  private connectedUsers: Partial<ConnectedUser>[] = [];

  async handleConnection(client: any, ...args: any[]) {
    console.log(this.connectedUsers);
  }

  @SubscribeMessage('afterConnect')
  setUser(client: Socket, payload: ConnectedPayload) {
    try {
      const findExistingUser = this.connectedUsers.find(
        (user) => user.userId === payload.userId,
      );
      if (findExistingUser) return;

      const createSocketUser = this.connectedUserFactory(
        payload.userId,
        payload.username,
        client.id,
      );
      this.connectedUsers.push(createSocketUser);
      console.log(this.connectedUsers);
    } catch (error) {
      client.emit('error', { message: "couldn't update status", error });
    }
  }

  async handleDisconnect(client: Socket) {
    const currentUserIndex = this.connectedUsers.findIndex(
      (user) => user.socketId === client.id,
    );
    this.connectedUsers.splice(currentUserIndex, 1);
    console.log(this.connectedUsers);
  }

  @SubscribeMessage('setStatus')
  async setUserStatus(client: Socket, payload: StatusPayload) {
    try {
      const userRepo = this.dataSource.getRepository(User);
      const findUser = await userRepo.findOneBy({ id: payload.userId });
      if (STATUS.includes(payload.status))
        if (findUser) {
          await userRepo.update(findUser, { status: payload.status });
          client.emit('setStatus', 'updated status');
        }
    } catch (error) {
      client.emit('error', { message: "couldn't update status", error });
    }
  }

  @SubscribeMessage('initTrade')
  async initTrade(client: Socket, payload: any) {
    const { targetId } = payload;
    const targetUser = this.connectedUsers.find(
      (user) => user.userId === targetId,
    );
    if (!targetUser) return client.emit('error', { message: 'User is away' });

    const currentUser = this.connectedUsers.find(
      (user) => user.socketId === client.id,
    );

    const currentUserIndex = this.connectedUsers.findIndex(
      (user) => user.socketId === client.id,
    );

    currentUser.acceptTrade = true;
    currentUser.trading = {
      isTrading: true,
      recipientId: targetId,
    };

    this.connectedUsers.splice(currentUserIndex, 1, currentUser);

    client.to(targetUser.socketId).emit('initTrade', {
      message: `${currentUser.username} wants to trade...`,
      data: {
        user: {
          userId: currentUser.userId,
          socketId: currentUser.socketId,
        },
      },
    });

    console.log(this.connectedUsers);
  }

  @SubscribeMessage('declineTrade')
  async declineTrade(client: Socket, payload: any) {
    const currentUser = this.connectedUsers.find(
      (user) => user.socketId === client.id,
    );

    const targetUser = this.connectedUsers.find(
      (user) => user.userId === payload.tradingId,
    );
    const targetUserIndex = this.connectedUsers.findIndex(
      (user) => user.userId === payload.tradingId,
    );

    targetUser.acceptTrade = false;
    targetUser.trading = {
      isTrading: false,
      recipientId: '',
    };

    this.connectedUsers.splice(targetUserIndex, 1, targetUser);

    client.to(targetUser.socketId).emit('declineTrade', {
      message: `${currentUser.username} declined the trade`,
    });

    console.log(this.connectedUsers);
  }
}
