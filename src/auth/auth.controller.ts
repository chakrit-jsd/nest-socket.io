import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  async GetUser(@Req() req: Request) {
    const token = await this.authService.GetUser(req.cookies);
    return { access_token: token };
  }
}
