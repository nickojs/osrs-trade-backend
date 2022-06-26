import { Controller, Get, Query } from '@nestjs/common';
import categories from './const/category';

interface ItemQuery {
  category: string;
  name: string;
}

@Controller('items')
export class ItemsController {
  @Get('/categories')
  getCategories(): Record<string, Record<number, string>> {
    return { categories };
  }

  @Get('/search')
  fetchItem(@Query() query: ItemQuery): any {
    return query;
  }
}
