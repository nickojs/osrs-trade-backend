import { APIItem } from 'src/containers/items/items.interface';

export enum SocketEvents {
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  SAVE_USER = 'save_user',
  SEND_ITEMS = 'send_items',
  DELIVER_ITEMS = 'deliver_items',
  OPEN_TRADE = 'open_trade',
  ACCEPT_TRADE = 'accept_trade',
  DECLINE_TRADE = 'decline_trade',
  DECLINE_EXISTING_TRADE = 'decline_existing_trade',
  FINISH_TRADE = 'finish_trade',
  SENDER_ACKNOWLEDGE = 'sender_acknowledge',
  RECIPIENT_ACKNOWLEDGE = 'recipient_acknowledge',
  REQUEST_USER_STATUS = 'request_user_status',
  RECIPIENT_STATUS = 'recipient_status',
  SET_USER_STATUS = 'setUserStatus',
  ERROR = 'error',
}

export enum SocketErrors {
  CONNECTION = "Couldn't establish connection with recipient",
  TRADE = 'Failed to complete the trade',
}
export interface ConnectedUser {
  socketId: string;
  userId: string;
  username: string;
  trading: {
    isTrading: boolean;
    recipientId: string;
  };
  acceptTrade: boolean;
  sendingItems: APIItem[];
}
