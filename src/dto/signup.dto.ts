import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @IsString({ message: 'Name must be a valid string.' })
  @ApiProperty({ description: 'The user\'s first name' })
  name: string; // Must be a valid email string

  @IsString({ message: 'Surname must be a valid string.' })
  @ApiProperty({ description: 'The user\'s last name' })
  surname: string; // Must be a valid email string

  @IsEmail()
  @ApiProperty({ description: 'The user\'s email address' })
  email: string; // Must be a valid email string

  @IsString({ message: 'Password must be a valid string.' })
  @ApiProperty({ description: 'The user\'s password' })
  @MinLength(7, { message: 'Password must be longer than 6 characters.' })
  @Matches(/[a-z]/, {
    message: 'Password must contain at least 1 lowercase letter.',
  })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least 1 uppercase letter.',
  })
  @Matches(/[^a-zA-Z0-9]/, {
    message: 'Password must contain at least 1 special character.',
  })
  @ApiProperty({ description: 'The user\'s password' })
  password: string; // Must be a string with at least 7 characters
}
