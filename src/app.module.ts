import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { AccountRequest } from './entities/account-requests.entity';
import { Account } from './entities/account.entity';
import { AccountsService } from './services/account.service';
import { AccountsController } from './controllers/account.controller';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([User, Currency, AccountRequest, Account]),
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
  controllers: [UserController, CurrenciesController, AccountsController],
  providers: [
    UserService,
    CurrenciesService,
    AccountsService,
    AuthGuard,
    RolesGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Automatically protects all application endpoints
    },
  ],
})
export class AppModule {}
