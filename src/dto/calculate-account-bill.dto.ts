import { IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateAccountBillDto {
  @ApiProperty({
    description: 'The billing period start date e.g 2026-06-05 (YYYY-MM-DD)',
    example: '2026-06-05',
  })
  @IsString({ message: 'billingPeriodStart must be a valid string.' })
  billingPeriodStart: string;

  @ApiProperty({
    description: 'The billing period end date e.g 2026-06-30 (YYYY-MM-DD)',
    example: '2026-06-30',
  })
  @IsString({ message: 'billingPeriodEnd must be a valid string.' })
  billingPeriodEnd: string;

  @ApiProperty({
    description: 'The number of transaction over the specified period e.g 23',
    example: 23,
  })
  @IsNumber({}, { message: 'transactionCount must be a valid number.' })
  @Min(0, { message: 'transactionCount must be a positive number.' })
  transactionCount: number;
}
