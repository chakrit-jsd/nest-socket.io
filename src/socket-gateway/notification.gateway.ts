import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthGuard } from 'src/auth/auth.guard';
import { SocketService } from './socket.service';
import { RedisService } from './redis.service';
import { Inject } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { DB, KeysPrefix } from 'src/constans';
import {
  CurrentHistory,
  GetMoreHistory,
  GetUnread,
} from './dto/socket-chat.dto';

@WebSocketGateway({ namespace: 'notification', cors: { origin: '*' } })
export class NotificationGateWay
  implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;
  constructor(
    private readonly socketService: SocketService,
    private readonly redisService: RedisService,
    @Inject(DB.REDIS_SUB) private redisSub: RedisClientType,
  ) {}

  afterInit(server: Server) {
    // middleware Jwt token;
    server.use(async (socket: Socket, next) => {
      const { access_token } = socket.handshake.auth;
      try {
        const payload = AuthGuard.authGuardJWT(access_token);
        socket['user'] = payload;
        // console.log(socket['user']);
        next();
      } catch (error) {
        // console.log(error);
        next(error);
      }
    });

    this.redisSub.pSubscribe('__key*__:*', async (m, c) => {
      const [prefix, id, room] = m.split('::');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [keyspace, event] = c.split(':');
      const status = await this.redisService.getStatus(id);
      if (!status) return;
      if (prefix === KeysPrefix.CHAT_HISTORY && event === 'zadd') {
        this.notiHistory(id);
      }
      if (prefix === KeysPrefix.CHAT_NOTI && event === 'incrby' && room) {
        this.notiUnread(id, room);
      }
      if (prefix === KeysPrefix.CHAT_NOTI && event === 'incrby' && !room) {
        this.notiUnreadAll(id);
      }
    });
  }

  async handleConnection(socket: Socket) {
    const userId = socket['user'].id;
    this.redisService.setOnline(userId);
    socket.join(userId);
    this.notiHistory(userId);
    this.notiUnreadAll(userId);
  }

  async handleDisconnect(socket: Socket) {
    this.redisService.setOffline(socket['user'].id);
    this.redisService.delCurrentHistory(socket['user'].id);
  }

  async notiHistory(id: string, lastTime?: string) {
    const res = await this.redisService.getHistory(id, lastTime);
    this.server.to(id).emit('chat_history', res);
  }

  async notiUnreadAll(id: string) {
    const count = await this.redisService.getAllUnreadCount(id);
    this.server.to(id).emit('noti_unread_all', { count: count });
  }

  async notiUnread(id: string, room: string) {
    const count = await this.redisService.getOneUnreadCount(id, room);
    this.server.to(id).emit('noti_unread', { room: room, count: count });
  }

  @SubscribeMessage('get_unread')
  async getUnread(
    @MessageBody() room: GetUnread,
    @ConnectedSocket() socket: Socket,
  ) {
    this.notiUnread(socket['user'].id, room.room);
  }

  @SubscribeMessage('get_more_history')
  async getMoreHistory(
    @MessageBody() getmore: GetMoreHistory,
    @ConnectedSocket() socket: Socket,
  ) {
    const res = await this.redisService.getHistory(
      socket['user'].id,
      getmore.lastTime,
    );
    this.server.to(socket['user'].id).emit('update_history', res);
  }

  @SubscribeMessage('current_history')
  async updateCurrentHistory(
    @MessageBody() curr: CurrentHistory,
    @ConnectedSocket() socket: Socket,
  ) {
    this.redisService.setCurrentHistory(socket['user'].id, curr.quantity);
  }
}
