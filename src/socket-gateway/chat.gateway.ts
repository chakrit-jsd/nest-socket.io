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
  ReJoinRoom,
  GetMember,
} from './dto/socket-chat.dto';
import { RedisService } from './redis.service';
import { Text } from './schemas/text.schema';

@WebSocketGateway({
  namespace: 'chat',
  cors: { origin: '*' },
})
export class SocketGateWay
  implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  constructor(
    private readonly socketService: SocketService,
    private readonly redisService: RedisService,
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
  }

  async handleConnection() {}

  handleDisconnect() {}

  @SubscribeMessage('join_room')
  async joinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() room: RequestRoomDto,
  ) {
    if (room.member === socket['user'].id) {
      return false;
    }
    let resRoom = await this.socketService.findRoom(
      socket['user'].id,
      room.member,
    );
    if (resRoom instanceof Error) {
      return false;
    }

    if (!resRoom) {
      resRoom = await this.socketService.createRoom(
        socket['user'].id,
        room.member,
      );
      if (resRoom instanceof Error) {
        return false;
      }
    }
    socket.join(resRoom.id);
    socket.emit('open_room', resRoom);
    return true;
  }

  @SubscribeMessage('re_join_room')
  reJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() rejoin: ReJoinRoom,
  ) {
    socket.join(rejoin.room);
    return true;
  }

  @SubscribeMessage('leave_room')
  async leaveRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() leave: LeaveRoom,
  ) {
    // console.log(socket['user']);
    socket.leave(leave.room);
    // console.log(socket.rooms);
  }
  @SubscribeMessage('get_member')
  async getMember(
    @ConnectedSocket() socket: Socket,
    @MessageBody() room: GetMember,
  ) {
    const res = await this.socketService.getMember(room.room);
    if (res instanceof Error) {
      return false;
    }

    return res;
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
    this.sendText(socket, res);
    await this.redisService.setHistory(chat.members, res.room.toString());
    return true;
  }

  private async sendText(socket: Socket, resText: Text) {
    const { _id, author, text, createdAt, room } = resText.toObject();
    const ack: Array<string> = await socket.nsp
      .timeout(1000)
      .to(resText.room.toString())
      .emitWithAck('text_receive', {
        _id: _id.toString(),
        author,
        text,
        createdAt,
        room,
      })
      .catch(() => console.log);
    if (ack.length === 1) {
      this.redisService.setOneUnreadCount(ack[0], resText.room.toString());
    }
  }

  @SubscribeMessage('get_texts')
  async getText(
    @ConnectedSocket() socket: Socket,
    @MessageBody() getTextDto: GetTextDto,
  ) {
    // console.log(getTextDto);
    const resTexts = await this.socketService.findTexts(
      getTextDto.room,
      getTextDto.lastTime,
      getTextDto.limit,
    );

    if (resTexts instanceof Error) {
      return false;
    }
    if (socket.rooms.has(getTextDto.room)) {
      this.redisService.delOneUnreadCount(socket['user'].id, getTextDto.room);
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
    socket.to(typingDto.room).emit('typing_receive', {
      author: socket['user'].id,
      status: typingDto.status,
      room: typingDto.room,
    });
  }
}
