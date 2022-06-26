import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { comparePw } from './helpers';

@Injectable()
export class AuthService {
  constructor(private usersService: UserService) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findUser(username);
    const compareHashedPws = await comparePw(pass, user.password);

    if (user && compareHashedPws) {
      const { password, ...rest } = user;
      return rest;
    }
    return null;
  }
}
