import { Module } from '@nestjs/common';
import { SocketModule } from './socket-gateway/socket.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    SocketModule,
    AuthModule,
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
    DatabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
