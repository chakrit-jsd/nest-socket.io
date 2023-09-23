export class RequestRoomDto {
  room?: string;
  member?: string;
}

export class CreateTextDto {
  room: string;
  text: string;
  members: string[];
}

export class GetTextDto {
  room: string;
  lastTime?: string = null;
  limit?: number = 20;
}

export class TypingDto {
  room: string;
  status: boolean;
}

export class LeaveRoom {
  room: string;
}
export class ReJoinRoom extends LeaveRoom {}
export class GetMember extends LeaveRoom {}
export class GetUnread extends LeaveRoom {}
export interface ResponseText {
  _id: string;
  author: string;
  text: string;
  createdAt: string;
}

export class GetMoreHistory {
  lastTime: string;
}

export class CurrentHistory {
  quantity: number;
}
