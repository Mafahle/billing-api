import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { dayjs } from '../utils/day-js.utils';

const configService: ConfigService = new ConfigService();

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number; // Database generated

  // set default role to admin
  @Column({
    default:
      configService.get<string>('NODE_ENV') !== 'production' ? 'admin' : 'user',
  })
  role: 'admin' | 'user'; // Enum for user roles

  @Column()
  name: string;

  @Column()
  surname: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Hashed password

  @CreateDateColumn({ default: dayjs.valueOf() })
  createdAt: number; // Timestamp of user creation
}
