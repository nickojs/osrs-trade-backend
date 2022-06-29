import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { comparePw } from './helpers';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) { }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findUser(username);

    if (Object.keys(user).length === 0) {
      throw new HttpException(
        {
          error: 'Check your credentials',
          status: HttpStatus.UNAUTHORIZED,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const compareHashedPws = await comparePw(pass, user.password);

    if (!compareHashedPws) {
      throw new HttpException(
        {
          error: 'Check your credentials',
          status: HttpStatus.UNAUTHORIZED,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user && compareHashedPws) {
      const { password, ...rest } = user;
      return rest;
    }
  }

  async login(user: User) {
    const payload = { username: user.username, id: user.id };
    return {
      token: this.jwtService.sign(payload),
    };
  }
}
