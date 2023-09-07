import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthGuard } from 'src/auth/auth.guard';
import { SocketService } from './socket.service';
import {
  CreateTextDto,
  RequestRoomDto,
  GetTextDto,
} from './dto/socket-chat.dto';

@WebSocketGateway({
  namespace: 'chat',
  cors: { origin: '*' },
})
export class SocketGateWay implements OnGatewayConnection, OnGatewayInit {
  @WebSocketServer()
  private server: Server;

  constructor(private readonly socketService: SocketService) {}

  afterInit(server: Server) {
    // middleware Jwt token;
    server.use(async (socket: Socket, next) => {
      const { access_token } = socket.handshake.auth;
      try {
        const payload = AuthGuard.authGuardJWT(access_token);
        socket['user'] = payload;
        next();
      } catch (error) {
        next(error);
      }
    });
  }

  async handleConnection() {
    console.log('connect');
  }

  @SubscribeMessage('join_room')
  async joinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() room: RequestRoomDto,
  ) {
    const resRoom = await this.socketService.findRoom(
      socket['user'].id,
      room.member,
    );
    if (resRoom instanceof Error) {
      return false;
    }

    if (!resRoom) {
      const resRoom = await this.socketService.createRoom(
        socket['user'].id,
        room.member,
      );
      if (resRoom instanceof Error) {
        return false;
      }
      socket.join(resRoom.id);
      return resRoom;
    }
    socket.join(resRoom.id);
    console.log('join', socket.rooms);
    return resRoom;
  }

  @SubscribeMessage('create_text')
  async createText(
    @ConnectedSocket() socket: Socket,
    @MessageBody() chat: CreateTextDto,
  ) {
    console.log('top chat', socket.rooms);
    const res = await this.socketService.createChatText(
      chat,
      socket['user'].id,
    );
    if (res instanceof Error) {
      return false;
    }
    this.server.timeout(1000).to(res.room.toString()).emit('text_receive', res);
    return true;
  }

  @SubscribeMessage('get_texts')
  async getText(@MessageBody() getTextDto: GetTextDto) {
    const resTexts = await this.socketService.findTexts(
      getTextDto.room,
      getTextDto.lastTime,
    );

    if (resTexts instanceof Error) {
      return false;
    }

    return resTexts;
  }
}

@WebSocketGateway({ namespace: 'notification' })
export class NotificationGateWay implements OnGatewayConnection {
  @WebSocketServer()
  private server: Server;

  handleConnection(socket: Socket) {
    console.log(socket.id);
  }
}
