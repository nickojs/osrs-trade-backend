import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { DefaultResponse } from 'src/interfaces/request.interface';
import { DataSource } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Inventory } from './entities/inventory.entity';

import { generateUrl, generateUrlForSingleItem, itemFactory } from './helpers';
import { APIItem, ItemQuery } from './items.interface';

@Injectable()
export class ItemsService {
  constructor(
    private readonly httpService: HttpService,
    private dataSource: DataSource,
  ) {}

  async fetchItems(params: ItemQuery) {
    const url = generateUrl(params);
    try {
      const request = await firstValueFrom(this.httpService.get(url));
      const { items }: { items: APIItem[] } = request.data;
      return items.map((item) => itemFactory(item));
    } catch (error) {
      throw new HttpException(
        {
          error,
          status: HttpStatus.NOT_FOUND,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async addToInventory(data: any, req) {
    const { item } = data;
    const inventoryRepository = this.dataSource.getRepository(Inventory);
    const userRepository = this.dataSource.getRepository(User);

    const currentUser = req.user;
    const findUser = await userRepository.findOne({
      where: {
        id: currentUser.id,
      },
      relations: ['inventory'],
    });

    if (findUser.inventory.length > 27) {
      throw new HttpException(
        {
          error: 'inventory full',
          status: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const inventoryItem = new Inventory();
    inventoryItem.itemId = item.id;
    inventoryItem.description = item.description;
    inventoryItem.iconUrl = item.icon;
    inventoryItem.name = item.name;

    inventoryItem.user = findUser;

    await inventoryRepository.save(inventoryItem);

    return { message: 'saved' };
  }

  async removeFromInventory(data: any, req) {
    const { item } = data;
    const inventoryRepository = this.dataSource.getRepository(Inventory);
    const userRepository = this.dataSource.getRepository(User);

    const { itemId } = item;
    const currentUser = req.user;
    const findUser = await userRepository.findOne({
      where: {
        id: currentUser.id,
      },
      relations: ['inventory'],
    });

    const { inventory } = findUser;

    const findItem = inventory.find((item) => item.itemId === itemId);

    if (!findItem) {
      throw new HttpException(
        {
          error: 'that item doesnt exist',
          status: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    await inventoryRepository.remove(findItem);
    return { message: 'removed item' };
  }
}
