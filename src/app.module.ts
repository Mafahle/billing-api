import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './config/database.module';
import { APP_GUARD } from '@nestjs/core/constants';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    DatabaseModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time window window in milliseconds (e.g., 60 seconds)
        limit: 10, // Maximum allowed requests inside the window
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true, // Makes vars available everywhere automatically
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Automatically protects all application endpoints
    },
  ],
})
export class AppModule {}
