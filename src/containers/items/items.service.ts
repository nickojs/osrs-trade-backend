import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import { generateUrl, itemFactory } from './helpers';
import { APIItem, ItemQuery } from './items.interface';

@Injectable()
export class ItemsService {
  constructor(private readonly httpService: HttpService) {}

  async fetchItems(params: ItemQuery) {
    const url = generateUrl(params);
    const request = await firstValueFrom(this.httpService.get(url));
    const { items }: { items: APIItem[] } = request.data;
    return items.map((item) => itemFactory(item));
  }
}
