import { Injectable } from '@nestjs/common';
import { SignUpDto } from 'src/dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

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
}
