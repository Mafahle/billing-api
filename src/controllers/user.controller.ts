import { Body, Controller, Post } from '@nestjs/common';
import { SignUpDto } from 'src/dto/signup.dto';
import { UserService } from 'src/services/user.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SignInDto } from 'src/dto/signin.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  @ApiBody({ type: SignUpDto })
  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  signUpUser(@Body() signUpDto: SignUpDto): Promise<any> {
    return this.userService.postSignUpUser(signUpDto);
  }

  @Post('signin')
  @ApiBody({ type: SignInDto })
  @ApiOperation({ summary: 'Sign in an existing user' })
  @ApiResponse({ status: 200, description: 'User signed in successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  signInUser(@Body() signInDto: SignInDto): Promise<any> {
    return this.userService.postSignInUser(signInDto);
  }
}
