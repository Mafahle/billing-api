import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignInDto {
  @IsEmail()
  email: string; // Must be a valid email string

  @IsString({ message: 'Password must be a valid string.' })
  @MinLength(7, { message: 'Password must be longer than 6 characters.' })
  password: string; // Must be a string with at least 7 characters
}
