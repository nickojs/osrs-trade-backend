import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { DefaultResponse } from 'src/interfaces/request.interface';
import { DataSource } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Inventory } from './entities/inventory.entity';

import { generateUrl, itemFactory } from './helpers';
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

  async addToInventory(item: APIItem, req) {
    const inventoryRepository = this.dataSource.getRepository(Inventory);
    const userRepository = this.dataSource.getRepository(User);

    const { id } = item;
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

    const existingItem = findUser.inventory.find((item) => item.itemId === id);

    if (existingItem) {
      if (existingItem.qtd === 99) {
        throw new HttpException(
          {
            error: "you can't carry more",
            status: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      existingItem.qtd++;
      await inventoryRepository.save(existingItem);
      return { message: 'updated item qtd' };
    }

    const inventoryItem = new Inventory();
    inventoryItem.itemId = id;
    inventoryItem.qtd = 1;
    inventoryItem.user = findUser;

    await inventoryRepository.save(inventoryItem);

    return { message: 'saved' };
  }

  async removeFromInventory(item: APIItem, req) {
    const inventoryRepository = this.dataSource.getRepository(Inventory);
    const userRepository = this.dataSource.getRepository(User);

    const { id } = item;
    const currentUser = req.user;
    const findUser = await userRepository.findOne({
      where: {
        id: currentUser.id,
      },
      relations: ['inventory'],
    });

    const { inventory } = findUser;

    const findItem = inventory.find((item) => item.itemId === id);

    if (!findItem) {
      throw new HttpException(
        {
          error: 'that item doesnt exist',
          status: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (findItem.qtd > 1) {
      findItem.qtd--;
      await inventoryRepository.save(findItem);
      return { message: 'removed item qtd' };
    }

    await inventoryRepository.remove(findItem);
    return { message: 'removed item' };
  }
}
