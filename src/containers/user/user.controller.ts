import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { DefaultResponse } from 'src/interfaces/request.interface';
import { UserCreationDTO } from './user.interface';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  // @Get()
  // findUser(@Body() id: number): Partial<User> {
  //   return {  };
  // }

  @Post()
  async createUser(@Body() userData: UserCreationDTO) {
    await this.userService.createUser(userData);
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
