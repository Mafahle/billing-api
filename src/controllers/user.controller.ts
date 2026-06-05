import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SignUpDto } from 'src/dto/signup.dto';
import { UserService } from 'src/services/user.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { SignInDto } from 'src/dto/signin.dto';
import { NewAccountRequestDto } from 'src/dto/new-account-request.dto';
import { Roles } from 'src/common/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';
import { AuthGuard } from 'src/guards/auth.guard';
import type { AuthenticatedRequest } from 'src/middlewares/user-auth.middleware';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: SignUpDto })
  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  signUpUser(@Body() signUpDto: SignUpDto): Promise<any> {
    return this.userService.postSignUpUser(signUpDto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: SignInDto })
  @ApiOperation({ summary: 'Sign in an existing user' })
  @ApiResponse({ status: 200, description: 'User signed in successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  signInUser(@Body() signInDto: SignInDto): Promise<any> {
    return this.userService.postSignInUser(signInDto);
  }

  @Post('new-account-request')
  @Roles('customer')
  @UseGuards(AuthGuard, RolesGuard) // Ensure user is authenticated and has the customer role
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token for authentication',
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a new account' })
  @ApiResponse({
    status: 200,
    description: 'New account request submitted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  newAccountRequest(
    @Body() newAccountRequestDto: NewAccountRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<any> {
    const userId = req.user?.id;
    return this.userService.postNewAccountRequest(newAccountRequestDto, userId);
  }
}
