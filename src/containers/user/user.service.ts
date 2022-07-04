import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { comparePw, hashPw } from '../auth/helpers';
import { User } from './entities/user.entity';
import { SearchUser, UserCreationDTO } from './user.interface';

@Injectable()
export class UserService {
  constructor(private dataSource: DataSource) {}

  async getUsers(query: SearchUser) {
    try {
      const userRepo = this.dataSource.getRepository(User);
      const { username } = query;

      const findUsers = await userRepo
        .createQueryBuilder('user')
        .where('user.username like :username', { username: `%${username}%` })
        .select(['user.id', 'user.username', 'user.profilePicId'])
        .limit(10)
        .getMany();

      return findUsers;
    } catch (error) {
      throw new HttpException(
        {
          error: 'couldnt fetch users',
          status: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getFullUser(username: string) {
    const userRepo = this.dataSource.getRepository(User);

    try {
      const findUser = await userRepo.findOne({
        where: { username },
      });

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

  async findUser(username: string) {
    const userRepo = this.dataSource.getRepository(User);

    try {
      const findUser = await userRepo.findOne({
        where: { username },
        relations: ['inventory'],
        select: ['id', 'inventory', 'username'],
      });

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

  async deleteUser(body: Record<string, string>, req) {
    const userRepo = this.dataSource.getRepository(User);
    const { userId } = req.user;
    const { password } = body;

    try {
      const findUser = await userRepo.findOneBy({ id: userId });

      if (!findUser) {
        throw new HttpException(
          {
            error: 'user already deleted',
            status: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (comparePw(password, findUser.password)) {
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

  async updateUser(userData: Partial<User>, req) {
    const userRepo = this.dataSource.getRepository(User);
    const { userId } = req.user;

    try {
      const findUser = await userRepo.findOneBy({ id: userId });
      if (userData.password) {
        const hashedPw = await hashPw(userData.password);

        const hashedUser = {
          ...findUser,
          password: hashedPw,
        };
        await userRepo.update(findUser, hashedUser);
        return { message: 'successfuly updated user' };
      }

      await userRepo.update(findUser, userData);
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
