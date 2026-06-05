import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { dayjs } from '../utils/day-js.utils';
import { Min } from 'class-validator';

@Entity('currencies')
export class Currency {
  @PrimaryGeneratedColumn()
  id: number; // Database generated

  @Column({ unique: true, nullable: false })
  currency: string; // Currency symbol

  @Column({ nullable: false })
  @Min(0, { message: 'Monthly fee in GBP must be a positive number.' })
  monthlyFeeGbp: number; // Monthly fee in GBP

  @CreateDateColumn({ default: dayjs.valueOf() })
  createdAt: number; // Timestamp of user creation
}
