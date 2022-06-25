import { config } from 'dotenv';
config();
import db from './config/db';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './containers/user/user.module';

@Module({
  imports: [TypeOrmModule.forRoot(db), UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
