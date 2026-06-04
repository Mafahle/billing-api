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
      configService.get<string>('NODE_ENV') !== 'production'
        ? 'admin'
        : 'customer',
  })
  role: 'admin' | 'customer'; // Enum for user roles

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  surname: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  password: string; // Hashed password

  @CreateDateColumn({ default: dayjs.valueOf() })
  createdAt: number; // Timestamp of user creation
}
