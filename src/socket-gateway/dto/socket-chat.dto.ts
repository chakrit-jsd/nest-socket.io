export class RequestRoomDto {
  member: string;
}

export class CreateTextDto {
  room: string;
  text: string;
}

export class GetTextDto {
  room: string;
  lastTime?: string = null;
}
