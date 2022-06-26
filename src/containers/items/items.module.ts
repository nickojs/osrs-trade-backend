import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';

@Module({
  imports: [],
  providers: [],
  controllers: [ItemsController],
})
export class ItemsModule {}
