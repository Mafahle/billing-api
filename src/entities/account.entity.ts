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
  accountId: string; // NOVO-DEN-3-1 (businessShortName-Country-UserId-AccountRequestId)

  @Column({ nullable: false })
  currency: string; // Currency for the account request

  @Column({ nullable: false, default: 0 })
  transactionThreshold: number; // Max free transactions per billing period

  @Column({ nullable: false })
  discountedDays: number;

  @Column({ nullable: false })
  discountedRate: number;

  @Column({ default: false, nullable: false })
  discountValid: boolean;

  @CreateDateColumn({ default: dayjs.valueOf() })
  createdAt: number; // Timestamp of when the account request was made
}
