import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';

@Module({
  imports: [HttpModule],
  providers: [ItemsService],
  controllers: [ItemsController],
})
export class ItemsModule {}
