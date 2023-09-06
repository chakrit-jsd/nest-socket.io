import { Module } from '@nestjs/common';
import { NotificationGateWay, SocketGateWay } from './socket.gateway';
import { SocketService } from './socket.service';
import { schemaProviders } from './schemas/schema.providers';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';

@Module({
  imports: [AuthModule],
  providers: [
    SocketGateWay,
    NotificationGateWay,
    SocketService,
    AuthService,
    ...schemaProviders,
  ],
})
export class SocketModule {}
