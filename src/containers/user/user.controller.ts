import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DefaultResponse } from 'src/interfaces/request.interface';
import { User } from './entities/user.entity';
import { UserCreationDTO } from './user.interface';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get(':username')
  async findUser(@Param('username') username: string): Promise<Partial<User>> {
    const user = await this.userService.findUser(username);
    const { password, ...rest } = user;
    return { ...rest };
  }

  @Post()
  createUser(@Body() userData: UserCreationDTO) {
    return this.userService.createUser(userData);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put()
  updateUser(@Body() userData: Partial<User>): Promise<DefaultResponse> {
    return this.userService.updateUser(userData);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/delete')
  deleteUser(@Body() user: User): Promise<DefaultResponse> {
    return this.userService.deleteUser(user);
  }
}
