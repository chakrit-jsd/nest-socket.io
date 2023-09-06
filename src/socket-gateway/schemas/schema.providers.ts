import { Connection } from 'mongoose';
import { DB, Repository } from 'src/constans';
import { RoomSchema } from './room.schema';
import { TextSchema } from './text.schema';

export const schemaProviders = [
  {
    provide: Repository.ROOM_MODEL,
    useFactory: (connection: Connection) =>
      connection.model('Rooms', RoomSchema, 'Rooms'),
    inject: [DB.MONGO_DB],
  },
  {
    provide: Repository.TEXT_MODEL,
    useFactory: (connection: Connection) =>
      connection.model('Texts', TextSchema, 'Texts'),
    inject: [DB.MONGO_DB],
  },
];
