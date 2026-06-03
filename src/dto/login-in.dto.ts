import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string; // Must be a valid email string

  @IsString()
  @MinLength(6)
  password: string; // Must be a string with at least 6 characters
}
