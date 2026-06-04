import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignUpDto } from 'src/dto/signup.dto';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { SignInDto } from 'src/dto/signin.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Signs up a new user with the provided details.
   * @param {SignUpDto} signUpDto - The sign-up data for the new user
   * @returns {Promise<any>} A message indicating success or failure of the sign-up process
   * @description This method checks if a user with the provided email already exists. If not, it hashes the password and saves the new user to the database. It returns a success message if the user is created successfully, or an error message if the user already exists or if any error occurs during the process.
   * @throws {Error} If any error occurs during the sign-up process
   */
  async postSignUpUser(signUpDto: SignUpDto): Promise<any> {
    try {
      // check if user already exists, hash the password, and save the user to the database
      const userExists = await this.userRepository.findOne({
        where: { email: signUpDto.email },
      });

      if (userExists) {
        return { message: 'User already exists!' };
      }
      const hashedPassword = await bcrypt.hash(signUpDto.password, 10);

      const user: User = this.userRepository.create({
        ...signUpDto,
        password: hashedPassword,
      });

      await this.userRepository.save(user);
      // Here you would typically call a repository or database method to create the user
      return { message: 'User signed up successfully!' };
    } catch (error) {
      console.error('Error signing up user:', error);
      return { message: 'Error signing up user!' };
    }
  }

  /**
   * Signs in a user with the provided credentials.
   * @param {SignInDto} signInDto - The sign-in data for the user
   * @returns {Promise<any>} A message indicating success or failure, and if successful, an access token and its details
   * @description This method checks if the user exists, compares the provided password with the stored hashed password, and if valid, generates a JWT access token for the user. It returns a success message along with the token and its details, or an error message if the credentials are invalid or if any error occurs during the process.
   * @throws {Error} If JWT secret is not configured in the environment variables
   */
  async postSignInUser(signInDto: SignInDto): Promise<any> {
    try {
      // check if user exists, compare the password, and return a success message or token
      const user = await this.userRepository.findOne({
        where: { email: signInDto.email },
      });

      if (!user) {
        return { message: 'User not found!' };
      }

      const isMatch = await bcrypt.compare(signInDto.password, user.password);
      if (!isMatch) {
        return { message: 'Invalid credentials!' };
      }

      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        throw new Error('JWT secret is not configured');
      }

      const expiresIn = '1h';
      const expiresInSeconds = 60 * 60;
      const signOptions: jwt.SignOptions = { expiresIn };
      // include user role in token payload for downstream authorization checks
      const accessToken = jwt.sign(
        { userId: user.id, role: (user as any).role },
        jwtSecret,
        signOptions,
      );

      return {
        message: 'User signed in successfully!',
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: expiresInSeconds,
      };
    } catch (error) {
      console.error('Error signing in user:', error);
      return { message: 'Error signing in user!' };
    }
  }
}
