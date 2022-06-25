import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './user.entity';
import { UserCreationDTO } from './user.interface';

@Injectable()
export class UserService {
  constructor(private dataSource: DataSource) {}

  async createUser(user: UserCreationDTO) {
    const userRepo = this.dataSource.getRepository(User);
    try {
      const createdUser = userRepo.create(user);
      await userRepo.save(createdUser);
      return { message: 'successfuly created user ' + createdUser.username };
    } catch (error) {
      return { message: 'couldnt create user' };
    }
  }
}
