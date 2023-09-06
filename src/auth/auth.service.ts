import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { Socket } from 'socket.io';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}
  async GetUser(socket: Socket) {
    try {
      const [key, value] = socket.handshake.headers.cookie?.split('=') || [];
      if (!key || !value) {
        throw new Error('access_denied');
      }
      const res = await axios.get(process.env.URL_USER, {
        headers: { Cookie: `${key}=${value}` },
      });
      const token = await this.jwtService.signAsync({ id: res?.data });
      return token;
    } catch (error) {
      throw new Error('access_denied');
    }
  }
}
