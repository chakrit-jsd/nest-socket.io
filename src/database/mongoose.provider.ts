import { Provider } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { DB } from 'src/constans';

export const mongooseProvider: Provider = {
  provide: DB.MONGO_DB,
  useFactory: (): Promise<typeof mongoose> =>
    mongoose.connect(process.env.MONGO_DB),
};
