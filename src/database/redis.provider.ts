import { Provider } from '@nestjs/common';
import { DB } from 'src/constans';
import { createClient } from 'redis';

export const redisProvider: Provider[] = [
  {
    provide: DB.REDIS_DB,
    useFactory: async () => {
      const redisClient = createClient({ url: process.env.REDIS_SERVER });
      redisClient.connect().catch((err) => console.log('redis', err));
      redisClient.configSet('notify-keyspace-events', 'Ezs$');
      // redisClient.on('error', (err) => console.log('redis2', err));
      return redisClient;
    },
  },
  {
    provide: DB.REDIS_SUB,
    useFactory: () => {
      const redisClient = createClient({ url: process.env.REDIS_SERVER });
      redisClient.connect().catch((err) => console.log('redis', err));
      // redisClient.on('error', (err) => console.log('redis2', err));
      return redisClient;
    },
  },
];
