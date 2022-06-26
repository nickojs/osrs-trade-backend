import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { hashPw } from '../auth/helpers';
import { User } from './entities/user.entity';
import { UserCreationDTO } from './user.interface';

@Injectable()
export class UserService {
  constructor(private dataSource: DataSource) {}

  async findUser(username: string) {
    const userRepo = this.dataSource.getRepository(User);

    try {
      const findUser = await userRepo.findOneBy({ username });
      return { ...findUser };
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
      const hashedPw = await hashPw(user.password);

      const hashedUser = {
        ...user,
        password: hashedPw,
      };

      const createdUser = userRepo.create(hashedUser);
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

  async deleteUser(user: User) {
    const userRepo = this.dataSource.getRepository(User);
    const { password, id } = user;

    try {
      const findUser = await userRepo.findOneBy({ id });
      if (findUser.password === password) {
        await userRepo.delete(findUser.id);
      }
      return { message: `deleted user` };
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

  async updateUser(userData: Partial<User>) {
    const userRepo = this.dataSource.getRepository(User);

    try {
      const findUser = await userRepo.findOneBy({ id: userData.id });
      await userRepo.update(findUser.id, userData);
      return { message: 'successfuly updated user' };
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
