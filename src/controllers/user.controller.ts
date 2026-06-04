import { Body, Controller, Post } from '@nestjs/common';
import { SignUpDto } from 'src/dto/signup.dto';
import { UserService } from 'src/services/user.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

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
}
