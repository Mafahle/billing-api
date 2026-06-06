import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignUpDto } from 'src/dto/signup.dto';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { SignInDto } from 'src/dto/signin.dto';
import { NewAccountRequestDto } from 'src/dto/new-account-request.dto';
import { AccountRequest } from 'src/entities/account-requests.entity';
import { Currency } from 'src/entities/currency.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AccountRequest)
    private readonly newAccountRequestRepository: Repository<AccountRequest>,
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
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
      const userExists = await this.userRepository.findOne({
        where: { email: signUpDto.email },
      });

      if (userExists) {
        throw new ConflictException('User already exists!');
      }
      const hashedPassword = await bcrypt.hash(signUpDto.password, 10);

      // Determine user role based on email domain
      const supportedDomains = this.configService
        .get<string>('SUPPORTED_DOMAINS', '')
        .split(',')
        .map((domain) => domain.trim().toLowerCase());

      const isAdminDomain = supportedDomains.includes(
        signUpDto.email.split('@')[1],
      );

      const user: User = this.userRepository.create({
        ...signUpDto,
        password: hashedPassword,
        role: isAdminDomain ? 'admin' : 'customer',
      });

      await this.userRepository.save(user);
      return { message: 'User signed up successfully!' };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error('Error signing up user:', error);
      throw new InternalServerErrorException('Error signing up user!');
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
      const user = await this.userRepository.findOne({
        where: { email: signInDto.email },
      });

      if (!user) {
        throw new UnauthorizedException('User not found!');
      }

      const isMatch = await bcrypt.compare(signInDto.password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials!');
      }

      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        throw new InternalServerErrorException('JWT secret not configured');
      }

      const expiresIn = '1h';
      const expiresInSeconds = 60 * 60;
      const signOptions: jwt.SignOptions = { expiresIn };
      const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        jwtSecret,
        signOptions,
      );

      return {
        message: 'User signed in successfully!',
        accessToken: accessToken,
        tokenType: 'Bearer',
        expiresIn: expiresInSeconds,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      console.error('Error signing in user:', error);
      throw new InternalServerErrorException('Error signing in user!');
    }
  }

  async postNewAccountRequest(
    newAccountRequestDto: NewAccountRequestDto,
    userId: number | undefined,
  ): Promise<any> {
    try {
      // Validate currency exists
      const currencyInDB = await this.currencyRepository.findOne({
        where: { currency: newAccountRequestDto.currency },
      });
      if (!currencyInDB) {
        throw new InternalServerErrorException('Currency not supported!');
      }

      // Create the account request within a transaction to safely compute queueNumber
      const result = await this.newAccountRequestRepository.manager.transaction(
        async (manager) => {
          // Ensure no duplicate request for the same user+currency
          const existing = await manager.findOne(AccountRequest, {
            where: { userId: userId, currency: newAccountRequestDto.currency },
          });
          if (existing) {
            throw new ConflictException('NewAccountRequest already exists!!');
          }

          // Compute next queue number (max + 1)
          const raw = await manager
            .createQueryBuilder(AccountRequest, 'ar')
            .select('MAX(ar.queueNumber)', 'max')
            .getRawOne<{ max: string | null }>();

          const maxQueue = raw?.max ? Number(raw.max) : 0;
          const nextQueue = maxQueue + 1;

          const newAccountRequest: AccountRequest = manager.create(
            AccountRequest,
            {
              ...newAccountRequestDto,
              userId: userId,
              queueNumber: nextQueue,
            },
          );

          await manager.save(newAccountRequest);
          return {
            message: 'NewAccountRequest created successfully!',
            id: newAccountRequest.id,
          };
        },
      );

      return result;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      console.error('Error signing in user:', error);
      throw new InternalServerErrorException('Error signing in user!');
    }
  }
}
