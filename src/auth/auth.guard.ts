import { JwtService } from '@nestjs/jwt';
import { Injectable, CanActivate } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContextHost): Promise<boolean> {
    const socket: Socket = context.switchToWs().getClient();
    const token = this.extractTokenFromHeader(socket);
    if (!token) {
      throw new WsException({ error: 'invalid access token' });
    }
    try {
      const { id } = await this.jwtService.verifyAsync(token);
      socket['userId'] = id;
    } catch (error) {
      // console.log(error);
      throw error;
    }
    return true;
  }

  private extractTokenFromHeader(socket: Socket): string | undefined {
    const { access_token } = socket.handshake.auth;
    return access_token ? access_token : undefined;
  }

  static authGuardJWT(access_token: string) {
    // console.log(typeof access_token);
    try {
      const { payload } = jwt.verify(access_token, process.env.JWT_SECRET, {
        complete: true,
      });
      // console.log(payload);
      return payload;
    } catch (error) {
      // console.log(error);
      if (error instanceof jwt.TokenExpiredError) {
        throw new WsException('token expired');
      }
      throw new WsException('access denied');
    }
  }
}
