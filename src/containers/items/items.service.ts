import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
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
        id: currentUser.userId,
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

  async removeFromInventory(data: any) {
    const { item } = data;
    const inventoryRepository = this.dataSource.getRepository(Inventory);
    try {
      const findItem = await inventoryRepository.findOne({
        where: { id: item.id },
      });
      await inventoryRepository.remove(findItem);
      if (!findItem) {
        throw new HttpException(
          {
            error: 'couldnt delete item',
            status: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      return { message: 'removed item' };
    } catch (error) {
      console.log(error);
    }
    return { message: 'removed item' };
  }

  async refreshInventory(req) {
    const userRepo = this.dataSource.getRepository(User);
    const itemRepo = this.dataSource.getRepository(Inventory);

    const url = (id: number) => generateUrlForSingleItem(id);
    const currentUser = req.user as User;

    try {
      const findUser = await userRepo.findOne({
        where: { username: currentUser.username },
        relations: ['inventory'],
        select: ['inventory'],
      });

      findUser.inventory.forEach(async (item) => {
        try {
          const request = await firstValueFrom(
            this.httpService.get(url(item.itemId)),
          );
          const { item: requestItem } = request.data;
          itemRepo.update(item, { iconUrl: requestItem.icon });
        } catch (error) {
          console.log('refreshInventory error: ', error);
        }
      });
    } catch (error) {
      throw new HttpException(
        {
          error,
          status: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
