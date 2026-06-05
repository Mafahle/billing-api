import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { dayjs } from '../utils/day-js.utils';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number; // Database generated

  @Column({ unique: true, nullable: false })
  accountId: string; // EUR-ITA-CHF-3-1 (Continent-Country-Currency-UserId-AccountRequestId)

  @Column({ nullable: false })
  currency: string; // Currency for the account request

  @Column({ nullable: false })
  discountedDays: number;

  @Column({ nullable: false })
  discountedRate: number;

  @Column({ default: false, nullable: false })
  discountValid: boolean;

  @CreateDateColumn({ default: dayjs.valueOf() })
  createdAt: number; // Timestamp of when the account request was made
}
