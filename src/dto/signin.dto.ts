import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({
    description: 'The email address of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string; // Must be a valid email string

  @ApiProperty({
    description: 'The password of the user',
    example: 'Password123!',
  })
  @IsString({ message: 'Password must be a valid string.' })
  @MinLength(7, { message: 'Password must be longer than 6 characters.' })
  password: string; // Must be a string with at least 7 characters
}
