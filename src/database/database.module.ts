import { Global, Module } from '@nestjs/common';
import { mongooseProvider } from './mongoose.provider';
import { redisProvider } from './redis.provider';

@Global()
@Module({
  providers: [mongooseProvider, ...redisProvider],
  exports: [mongooseProvider, ...redisProvider],
})
export class DatabaseModule {}
