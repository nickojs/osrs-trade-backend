import { config } from 'dotenv';
config();

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserController } from './controllers/user/user.controller';
import db from './config/db';

console.log(db);

@Module({
  imports: [TypeOrmModule.forRoot(db)],
  controllers: [AppController, UserController],
  providers: [AppService],
})
export class AppModule {}
