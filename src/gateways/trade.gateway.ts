import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayDisconnect,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Inventory } from 'src/containers/items/entities/inventory.entity';
import { User } from 'src/containers/user/entities/user.entity';
import { DataSource } from 'typeorm';
import { ConnectedUser } from '../interfaces/socketModel';
import { cleanUser, connectedUserFactory, getUser } from './helper';

type ConnectedPayload = {
  userId: string;
  username: string;
};

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

      if (
        createSocketUser.userId === undefined ||
        createSocketUser.socketId === undefined
      )
        return; // needs to thrown an error here

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

  @SubscribeMessage('requestTrade')
  async initTrade(client: Socket, payload: any) {
    try {
      const { targetId } = payload;
      const targetUser = getUser(targetId, 'userId', this.connectedUsers);
      if (targetUser.index === -1)
        return client.emit('error', { message: 'User is away' });

      const currentUser = getUser(client.id, 'socketId', this.connectedUsers);

      currentUser.user.trading = {
        isTrading: true,
        recipientId: targetId,
      };

      this.connectedUsers.splice(currentUser.index, 1, currentUser.user);

      client.to(targetUser.user.socketId).emit('requestTrade', {
        message: `${currentUser.user.username} wants to trade...`,
      });

      client.to(targetUser.user.socketId).emit('updateUser', {
        targetUser: currentUser.user,
        currentUser: targetUser.user,
      });

      client.emit('updateUser', {
        targetUser: targetUser.user,
        currentUser: currentUser.user,
      });
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
      currentUser.user.trading = {
        isTrading: true,
        recipientId: payload.tradingId,
      };

      this.connectedUsers.splice(currentUser.index, 1, currentUser.user);

      client.to(targetUser.user.socketId).emit('updateUser', {
        targetUser: currentUser.user,
        currentUser: targetUser.user,
      });

      client.emit('updateUser', {
        targetUser: targetUser.user,
        currentUser: currentUser.user,
      });

      console.log(this.connectedUsers);
    } catch (error) {
      console.log(error);
      client.emit('error', { message: 'acceptTradeInit error', error });
    }
  }

  @SubscribeMessage('sendItem')
  async sendItem(client: Socket, payload: any) {
    try {
      const { item, targetId } = payload;
      const currentUser = getUser(client.id, 'socketId', this.connectedUsers);
      const targetUser = getUser(targetId, 'userId', this.connectedUsers);

      if (currentUser.user.trading.isTrading) {
        currentUser.user.sendingItems = [
          ...currentUser.user.sendingItems,
          item,
        ];
        this.connectedUsers.splice(currentUser.index, 1, currentUser.user);
      }
      console.log(this.connectedUsers);

      client.to(targetUser.user.socketId).emit('updateUser', {
        targetUser: currentUser.user,
        currentUser: targetUser.user,
      });

      client.emit('updateUser', {
        targetUser: targetUser.user,
        currentUser: currentUser.user,
      });
    } catch (error) {
      client.emit('error', { message: 'sendItem error', error });
    }
  }

  @SubscribeMessage('removeItem')
  async removeItem(client: Socket, payload: any) {
    try {
      const { item, targetId } = payload;
      const currentUser = getUser(client.id, 'socketId', this.connectedUsers);
      const targetUser = getUser(targetId, 'userId', this.connectedUsers);

      const findItemToRemove = currentUser.user.sendingItems.findIndex(
        (i) => i.id === item.id,
      );

      if (findItemToRemove > -1) {
        currentUser.user.sendingItems.splice(findItemToRemove, 1);
        this.connectedUsers.splice(currentUser.index, 1, currentUser.user);
      }

      client.to(targetUser.user.socketId).emit('updateUser', {
        targetUser: currentUser.user,
        currentUser: targetUser.user,
      });

      client.emit('updateUser', {
        targetUser: targetUser.user,
        currentUser: currentUser.user,
      });
    } catch (error) {
      client.emit('error', { message: 'removeItem error', error });
    }
  }

  @SubscribeMessage('acknowledgeTrade')
  async confirmTrade(client: Socket, payload: any) {
    const inventoryRepo = this.dataSource.getRepository(Inventory);
    const userRepo = this.dataSource.getRepository(User);

    try {
      const { targetId } = payload;
      const currentUser = getUser(client.id, 'socketId', this.connectedUsers);
      const currentUserRepo = await userRepo.findOne({
        where: { id: currentUser.user.userId },
      });
      const targetUser = getUser(targetId, 'userId', this.connectedUsers);
      const targetUserRepo = await userRepo.findOne({
        where: { id: targetUser.user.userId },
      });

      currentUser.user.acceptTrade = true;
      this.connectedUsers.splice(currentUser.index, 1, currentUser.user);

      client.to(targetUser.user.socketId).emit('updateUser', {
        targetUser: currentUser.user,
        currentUser: targetUser.user,
      });

      client.emit('updateUser', {
        targetUser: targetUser.user,
        currentUser: currentUser.user,
      });

      if (targetUser.user.acceptTrade) {
        const targetItems = targetUser.user.sendingItems;
        const currentItems = currentUser.user.sendingItems;

        if (targetItems.length === 0 && currentItems.length === 0) return;

        targetItems.forEach(async (tItem: any) => {
          const getItem = await inventoryRepo.findOne({
            where: { id: tItem.id },
            relations: ['user'],
          });
          getItem.user = currentUserRepo;
          await inventoryRepo.save(getItem);
        });

        currentItems.forEach(async (cItem: any) => {
          const getItem = await inventoryRepo.findOne({
            where: { id: cItem.id },
            relations: ['user'],
          });
          getItem.user = targetUserRepo;
          await inventoryRepo.save(getItem);
        });

        const cleanTargetUser = cleanUser(targetUser.user);
        const cleanCurrentUser = cleanUser(currentUser.user);

        this.connectedUsers.splice(targetUser.index, 1, cleanTargetUser);
        this.connectedUsers.splice(currentUser.index, 1, cleanCurrentUser);

        client.emit('completeTrade');
        client.to(targetUser.user.socketId).emit('completeTrade');
      }
    } catch (error) {
      client.emit('error', { message: 'removeItem error', error });
    }
  }
}
