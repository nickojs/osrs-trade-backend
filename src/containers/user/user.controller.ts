import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { DefaultResponse } from 'src/interfaces/request.interface';
import { UserCreationDTO } from './user.interface';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':userId')
  findUser(@Param('userId') userId: string): Promise<Partial<UserCreationDTO>> {
    return this.userService.findUser(userId);
  }

  @Post()
  createUser(@Body() userData: UserCreationDTO) {
    return this.userService.createUser(userData);
  }

  // @Put()
  // updateUser(@Body() userData: Partial<UserCreationDTO>): DefaultResponse {

  //   return { message: 'updated user' };
  // }

  @Delete()
  deleteUser(/* needs id */): DefaultResponse {
    return { message: "I'm deleting users" };
  }
}
