import { Module } from '@nestjs/common';
import { SocketGateWay } from './chat.gateway';
import { SocketService } from './socket.service';
import { schemaProviders } from './schemas/schema.providers';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';
import { RedisService } from './redis.service';
import { NotificationGateWay } from './notification.gateway';

@Module({
  imports: [AuthModule],
  providers: [
    SocketGateWay,
    NotificationGateWay,
    SocketService,
    AuthService,
    RedisService,
    ...schemaProviders,
  ],
})
export class SocketModule {}
