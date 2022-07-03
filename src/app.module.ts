import { config } from 'dotenv';
config();
import db from './config/db';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './containers/user/user.module';
import { ItemsModule } from './containers/items/items.module';
import { AuthModule } from './containers/auth/auth.module';
import { TradeGateway } from './gateways/trade.gateway';

@Module({
  imports: [TypeOrmModule.forRoot(db), UsersModule, ItemsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService, TradeGateway],
})
export class AppModule {}
