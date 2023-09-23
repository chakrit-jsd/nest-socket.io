import { Room } from './schemas/room.schema';
import { Text } from './schemas/text.schema';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Repository } from 'src/constans';
import { CreateTextDto } from './dto/socket-chat.dto';

@Injectable()
export class SocketService {
  constructor(
    @Inject(Repository.ROOM_MODEL) private room: Model<Room>,
    @Inject(Repository.TEXT_MODEL) private chatText: Model<Text>,
  ) {}

  async getMember(room: string) {
    try {
      const res = await this.room.findById(room);
      return res;
    } catch (error) {
      return error;
    }
  }

  async createRoom(id1: string, id2: string) {
    try {
      const room = await this.room.create({ members: [id1, id2] });
      return room;
    } catch (error) {
      return error;
    }
  }

  async findRoom(id1: string, id2: string) {
    try {
      const room = await this.room.findOne({
        $or: [{ members: [id1, id2] }, { members: [id2, id1] }],
      });
      return room;
    } catch (error) {
      return error;
    }
  }

  async findRooms(id: string) {
    try {
      const rooms = await this.room.find({ members: [id] });
      return rooms;
    } catch (error) {
      console.log(error);
    }
  }

  async findTexts(room: string, lastTime: string = null, limit: number = 20) {
    const queryTime = new Date(lastTime || Date.now());
    try {
      const texts = await this.chatText
        .find({ room: room, createdAt: { $lt: queryTime } })
        .select(['text', 'author', 'createdAt'])
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      // console.log(texts.length);
      texts.reverse();
      return texts;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  // async findManyTexts(id: string, )
  async createChatText(
    chatText: CreateTextDto,
    authorId: string,
  ): Promise<Text | Error> {
    try {
      const res = await this.chatText.create({ ...chatText, author: authorId });
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
}
