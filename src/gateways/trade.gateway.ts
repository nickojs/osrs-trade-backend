import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayDisconnect,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { DataSource } from 'typeorm';
import { User } from '../containers/user/entities/user.entity';
import { ConnectedUser } from '../interfaces/socketModel';
import { cleanUser, connectedUserFactory, getUser } from './helper';

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
  private connectedUsers: ConnectedUser[] = [];

  async handleConnection(client: any, ...args: any[]) {
    console.log(this.connectedUsers);
  }

  @SubscribeMessage('afterConnect')
  setUser(client: Socket, payload: ConnectedPayload) {
    try {
      const user = getUser(payload.userId, 'userId', this.connectedUsers);
      if (user.index > -1) return;

      const createSocketUser = connectedUserFactory(
        payload.userId,
        payload.username,
        client.id,
      );

      this.connectedUsers.push(createSocketUser);
      console.log(this.connectedUsers);
    } catch (error) {
      client.emit('error', { message: 'connection error', error });
    }
  }

  async handleDisconnect(client: Socket) {
    const user = getUser(client.id, 'socketId', this.connectedUsers);
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
    try {
      const { targetId } = payload;
      const targetUser = getUser(targetId, 'userId', this.connectedUsers);
      if (targetUser.index === -1)
        return client.emit('error', { message: 'User is away' });

      const currentUser = getUser(client.id, 'socketId', this.connectedUsers);

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
    } catch (error) {
      client.emit('error', { message: 'initTrade error', error });
    }
  }

  @SubscribeMessage('declineTrade')
  async declineTrade(client: Socket, payload: any) {
    try {
      const currentUser = getUser(client.id, 'socketId', this.connectedUsers);
      const targetUser = getUser(
        payload.tradingId,
        'userId',
        this.connectedUsers,
      );

      const cleanTargetUser = cleanUser(targetUser.user);
      const cleanCurrentUser = cleanUser(currentUser.user);

      this.connectedUsers.splice(targetUser.index, 1, cleanTargetUser);
      this.connectedUsers.splice(currentUser.index, 1, cleanCurrentUser);

      client.to(targetUser.user.socketId).emit('declineTrade', {
        message: `${currentUser.user.username} declined the trade`,
      });

      console.log(this.connectedUsers);
    } catch (error) {
      client.emit('error', { message: 'declineTrade error', error });
    }
  }

  @SubscribeMessage('acceptTradeInit')
  async acceptTradeInit(client: Socket, payload: any) {
    try {
      const currentUser = getUser(client.id, 'socketId', this.connectedUsers);
      const targetUser = getUser(
        payload.tradingId,
        'userId',
        this.connectedUsers,
      );

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
    } catch (error) {
      client.emit('error', { message: 'acceptTradeInit error', error });
    }
  }

  @SubscribeMessage('sendItem')
  async sendItem(client: Socket, payload: any) {
    try {
      const { items, tradingId } = payload;
      const currentUser = getUser(client.id, 'socketId', this.connectedUsers);
      const targetUser = getUser(tradingId, 'userId', this.connectedUsers);

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
    } catch (error) {
      client.emit('error', { message: 'sendItem error', error });
    }
  }

  @SubscribeMessage('completeTrade')
  async completeTrade(client: Socket, payload: any) {
    try {
      const { targetId } = payload;
      const currentUser = getUser(client.id, 'socketId', this.connectedUsers);
      const targetUser = getUser(targetId, 'userId', this.connectedUsers);

      // trade item logic

      console.log(this.connectedUsers);
    } catch (error) {
      client.emit('error', { message: 'completeTrade error', error });
    }
  }
}
