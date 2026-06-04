import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SignUpDto } from 'src/dto/signup.dto';
import { UserService } from 'src/services/user.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SignInDto } from 'src/dto/signin.dto';

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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  signInUser(@Body() signInDto: SignInDto): Promise<any> {
    return this.userService.postSignInUser(signInDto);
  }
}
