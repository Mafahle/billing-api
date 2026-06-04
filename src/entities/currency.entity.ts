import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { dayjs } from '../utils/day-js.utils';

@Entity('currencies')
export class Currency {
  @PrimaryGeneratedColumn()
  id: number; // Database generated

  @Column({ unique: true, nullable: true })
  symbol: string; // Currency symbol

  @Column({ unique: true, nullable: true })
  country: string;

  @Column({ nullable: true })
  baseAccountFee: string;

  @CreateDateColumn({ default: dayjs.valueOf() })
  createdAt: number; // Timestamp of user creation
}
