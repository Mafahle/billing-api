import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthenticatedRequest,
  verifyAuthToken,
} from 'src/middlewares/user-auth.middleware';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = (request.headers['authorization'] ||
      request.headers['Authorization']) as string | undefined;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const token = parts[1];

    try {
      request.user = verifyAuthToken(token, this.configService);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
