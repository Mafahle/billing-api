import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import * dayjs from 'dayjs';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number; // Database generated

  // set default role to admin
  @Column({ default: process.env.NODE_ENV !== 'production' ? 'admin' : 'user' })
  role: 'admin' | 'user'; // Enum for user roles

  @Column()
  name: string;

  @Column()
  surname: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Hashed password

  @CreateDateColumn()
  createdAt: Date; // Database generated
  // use datetime node package
}
