import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DefaultResponse } from 'src/interfaces/request.interface';
import categories from './const/category';
import { APIItem, ItemQuery } from './items.interface';
import { ItemsService } from './items.service';

@Controller('items')
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('/categories')
  getCategories(): Record<string, Record<number, string>> {
    return { categories };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/search')
  fetchItem(@Query() query: ItemQuery): Promise<APIItem[]> {
    return this.itemsService.fetchItems(query);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/inventory/add')
  addToInventory(@Body() item: APIItem): DefaultResponse {
    return { message: 'test' };
  }
}
