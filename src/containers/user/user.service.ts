import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './user.entity';
import { UserCreationDTO } from './user.interface';

@Injectable()
export class UserService {
  constructor(private dataSource: DataSource) {}

  async findUser(userId: string) {
    const userRepo = this.dataSource.getRepository(User);

    try {
      const findUser = await userRepo.findBy({ id: userId });
      const { username, id } = findUser[0];
      return {
        username,
        id,
      };
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

  async createUser(user: UserCreationDTO) {
    const userRepo = this.dataSource.getRepository(User);
    try {
      const createdUser = userRepo.create(user);
      await userRepo.save(createdUser);
      return { message: 'successfuly created user ' + createdUser.username };
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

  async deleteUser(userId: string) {
    const userRepo = this.dataSource.getRepository(User);
    try {
      console.log(userId);
      const findUser = await userRepo.findOne({ where: { id: userId } });
      const { username, id } = findUser;
      return {
        username,
        id,
      };
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
