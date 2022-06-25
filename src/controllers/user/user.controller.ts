import { Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { DefaultResponse } from 'src/interfaces/request.interface';
import { User } from 'src/interfaces/user.interface';

const mockUser = {
  id: 1,
  username: 'nic',
  password: 'very secret, hashed and salted string',
};

@Controller('user')
export class UserController {
  @Get()
  findUser(/* needs id */): Partial<User> {
    // pretends to fetch an user
    return { username: mockUser.username };
  }

  @Post()
  createUser(/* needs user data */): DefaultResponse {
    return { message: 'created user' };
  }

  @Put()
  updateUser(/* needs id + user fields to update */): DefaultResponse {
    return { message: 'updated user' };
  }

  @Delete()
  deleteUser(/* needs id */): DefaultResponse {
    return { message: "I'm deleting users" };
  }
}
