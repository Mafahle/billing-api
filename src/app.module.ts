import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './config/database.module';
import { APP_GUARD } from '@nestjs/core/constants';
import { ConfigModule } from '@nestjs/config';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Currency } from './entities/currency.entity';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CurrenciesService } from './services/currencies.service';
import { CurrenciesController } from './controllers/currencies.controller';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([User, Currency]),
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
  controllers: [AppController, UserController, CurrenciesController],
  providers: [
    AppService,
    UserService,
    CurrenciesService,
    AuthGuard,
    RolesGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Automatically protects all application endpoints
    },
  ],
})
export class AppModule {}
