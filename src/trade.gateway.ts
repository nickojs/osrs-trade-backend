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
  @WebSocketServer() server: Socket;
  constructor(private dataSource: DataSource) {}
  private connectedUsers: ConnectedUser[] = [];

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

  private getUser(id: string, identifier: 'socketId' | 'userId') {
    switch (identifier) {
      case 'socketId':
        return {
          user: this.connectedUsers.find((user) => user.socketId === id),
          index: this.connectedUsers.findIndex((user) => user.socketId === id),
        };
      case 'userId':
        return {
          user: this.connectedUsers.find((user) => user.userId === id),
          index: this.connectedUsers.findIndex((user) => user.userId === id),
        };
      default:
        throw new Error('[getUser] unknown identifier provided');
    }
  }

  private cleanUser(user: ConnectedUser) {
    const { userId, username, socketId } = user;
    return this.connectedUserFactory(userId, username, socketId);
  }

  async handleConnection(client: any, ...args: any[]) {
    console.log(this.connectedUsers);
  }

  @SubscribeMessage('afterConnect')
  setUser(client: Socket, payload: ConnectedPayload) {
    const user = this.getUser(payload.userId, 'userId');
    if (user.index > -1) return;

    const createSocketUser = this.connectedUserFactory(
      payload.userId,
      payload.username,
      client.id,
    );

    this.connectedUsers.push(createSocketUser);
    console.log(this.connectedUsers);
  }

  async handleDisconnect(client: Socket) {
    const user = this.getUser(client.id, 'socketId');
    if (user.index > -1) {
      this.connectedUsers.splice(user.index, 1);
    }
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
    const targetUser = this.getUser(targetId, 'userId');
    if (targetUser.index === -1)
      return client.emit('error', { message: 'User is away' });

    const currentUser = this.getUser(client.id, 'socketId');

    currentUser.user.acceptTrade = true;
    currentUser.user.trading = {
      isTrading: true,
      recipientId: targetId,
    };

    this.connectedUsers.splice(currentUser.index, 1, currentUser.user);

    client.to(targetUser.user.socketId).emit('initTrade', {
      message: `${currentUser.user.username} wants to trade...`,
      data: {
        user: {
          userId: currentUser.user.userId,
          socketId: currentUser.user.socketId,
        },
      },
    });

    console.log(this.connectedUsers);
  }

  @SubscribeMessage('declineTrade')
  async declineTrade(client: Socket, payload: any) {
    const currentUser = this.getUser(client.id, 'socketId');
    const targetUser = this.getUser(payload.tradingId, 'userId');

    const cleanTargetUser = this.cleanUser(targetUser.user);
    const cleanCurrentUser = this.cleanUser(currentUser.user);

    this.connectedUsers.splice(targetUser.index, 1, cleanTargetUser);
    this.connectedUsers.splice(currentUser.index, 1, cleanCurrentUser);

    client.to(targetUser.user.socketId).emit('declineTrade', {
      message: `${currentUser.user.username} declined the trade`,
    });

    console.log(this.connectedUsers);
  }

  @SubscribeMessage('acceptTradeInit')
  async acceptTradeInit(client: Socket, payload: any) {
    const currentUser = this.getUser(client.id, 'socketId');
    const targetUser = this.getUser(payload.tradingId, 'userId');

    currentUser.user.acceptTrade = true;
    currentUser.user.trading = {
      isTrading: true,
      recipientId: payload.tradingId,
    };

    this.connectedUsers.splice(currentUser.index, 1, currentUser.user);

    client.to(targetUser.user.socketId).emit('acceptTrade', {
      message: `${currentUser.user.username} accepts the trade init`,
    });

    console.log(this.connectedUsers);
  }

  @SubscribeMessage('sendItem')
  async sendItem(client: Socket, payload: any) {
    const { items, tradingId } = payload;
    const currentUser = this.getUser(client.id, 'socketId');
    const targetUser = this.getUser(tradingId, 'userId');

    if (
      currentUser.user.trading.isTrading &&
      targetUser.user.trading.isTrading
    ) {
      currentUser.user.sendingItems = items;
      targetUser.user.receivingItems = items;

      this.connectedUsers.splice(currentUser.index, 1, currentUser.user);
      this.connectedUsers.splice(targetUser.index, 1, targetUser.user);
    }
    console.log(this.connectedUsers);
  }
}
