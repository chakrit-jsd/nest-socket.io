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
import {
  CreateTextDto,
  RequestRoomDto,
  GetTextDto,
  TypingDto,
  LeaveRoom,
} from './dto/socket-chat.dto';

@WebSocketGateway({
  namespace: 'chat',
  cors: { origin: '*' },
})
export class SocketGateWay
  implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect
{
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
        // console.log(socket['user']);
        next();
      } catch (error) {
        // console.log(error);
        next(error);
      }
    });
  }

  async handleConnection() {
    // console.log(socket['user']);
    // console.log('connect');
    // console.log(socket.rooms);
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log('disconnect', socket.id);
    // console.log(socket.rooms);
  }

  @SubscribeMessage('join_room')
  async joinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() room: RequestRoomDto,
  ) {
    if (room.member === socket['user'].id) {
      return false;
    }
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
      socket.emit('open_room', resRoom);
      return true;
    }
    socket.join(resRoom.id);
    // console.log('join', socket.rooms);
    socket.emit('open_room', resRoom);
    return true;
  }

  @SubscribeMessage('leave_room')
  leaveRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() leave: LeaveRoom,
  ) {
    // console.log(socket.rooms);
    socket.leave(leave.room);
    // console.log(socket.rooms);
  }

  @SubscribeMessage('create_text')
  async createText(
    @ConnectedSocket() socket: Socket,
    @MessageBody() chat: CreateTextDto,
  ) {
    // console.log('top chat', socket.rooms);
    const res = await this.socketService.createChatText(
      chat,
      socket['user'].id,
    );
    if (res instanceof Error) {
      return false;
    }
    if (
      (await this.server.in(res.room.toString()).fetchSockets()).length === 1
    ) {
      console.log('notification');
    }
    const { _id, author, text, createdAt, room } = res.toObject();
    this.server
      .timeout(1000)
      .to(res.room.toString())
      .emit(
        'text_receive',
        { _id: _id.toString(), author, text, createdAt, room },
        (err: any, res: string[]) => {
          console.log('err', err);
          console.log('res', res);
        },
      );
    // console.log(resReceive);
    return true;
  }

  @SubscribeMessage('get_texts')
  async getText(@MessageBody() getTextDto: GetTextDto) {
    // console.log(getTextDto);
    const resTexts = await this.socketService.findTexts(
      getTextDto.room,
      getTextDto.lastTime,
      getTextDto.limit,
    );

    if (resTexts instanceof Error) {
      return false;
    }

    return resTexts;
  }

  @SubscribeMessage('get_last_text')
  async getLastText(
    @ConnectedSocket() socket: Socket,
    @MessageBody() room: RequestRoomDto,
  ) {
    // console.log(room.room);
    let roomId: string = room.room;
    if (!room.room) {
      const resRoom = await this.socketService.findRoom(
        socket['user'].id,
        room.member,
      );
      roomId = resRoom.id;
    }
    const resText = await this.socketService.findTexts(roomId, null, 1);
    return { ...resText[0], room: roomId };
  }

  @SubscribeMessage('send_typing')
  typingHandle(
    @ConnectedSocket() socket: Socket,
    @MessageBody() typingDto: TypingDto,
  ) {
    this.server.to(typingDto.room).emit('typing_receive', {
      author: socket['user'].id,
      status: typingDto.status,
      room: typingDto.room,
    });
  }
}

@WebSocketGateway({ namespace: 'notification', cors: { origin: '*' } })
export class NotificationGateWay implements OnGatewayConnection {
  @WebSocketServer()
  private server: Server;

  handleConnection(socket: Socket) {
    console.log(socket.id);
  }
}
