import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { dayjs } from '../utils/day-js.utils';

@Entity('account_requests')
export class AccountRequest {
  @PrimaryGeneratedColumn()
  id: number; // Database generated

  @Column({ nullable: false })
  userId: number; // ID of the user making the request

  // queueNumber is assigned by application logic to avoid DB-specific auto-increment
  @Column({ type: 'integer', nullable: false })
  queueNumber: number; // Queue number for the account request

  @Column({ nullable: false })
  currency: string; // Currency for the account request

  @Column({ default: 'pending' })
  status: 'pending' | 'approved' | 'rejected'; // Status of the account request

  @CreateDateColumn({ default: dayjs.valueOf() })
  createdAt: number; // Timestamp of when the account request was made
}
