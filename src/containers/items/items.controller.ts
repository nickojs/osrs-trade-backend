import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DefaultResponse } from 'src/interfaces/request.interface';
import categories from './const/category';
import { APIItem, ItemQuery } from './items.interface';
import { ItemsService } from './items.service';

@Controller('items')
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  @Get('/categories')
  getCategories(): Record<string, Record<number, string>> {
    return { categories };
  }

  @Get('/search')
  fetchItem(@Query() query: ItemQuery): Promise<APIItem[]> {
    return this.itemsService.fetchItems(query);
  }

  @Post('/inventory/add')
  addToInventory(@Body() item: APIItem): DefaultResponse {
    return { message: 'test' };
  }
}
