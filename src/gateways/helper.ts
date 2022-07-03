import { ConnectedUser } from 'src/interfaces/socketModel';

export const connectedUserFactory = (
  userId: string,
  username: string,
  socketId: string,
): ConnectedUser => {
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
};

export const cleanUser = (user: ConnectedUser) => {
  const { userId, username, socketId } = user;
  return connectedUserFactory(userId, username, socketId);
};

interface GetUserReturnType {
  user: ConnectedUser;
  index: number;
}

export const getUser = (
  id: string,
  identifier: 'socketId' | 'userId',
  userList,
): GetUserReturnType => {
  switch (identifier) {
    case 'socketId':
      return {
        user: userList.find((user) => user.socketId === id),
        index: userList.findIndex((user) => user.socketId === id),
      };
    case 'userId':
      return {
        user: userList.find((user) => user.userId === id),
        index: userList.findIndex((user) => user.userId === id),
      };
    default:
      throw new Error('[getUser] unknown identifier provided');
  }
};
