import { IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNewAccountDto {
  @ApiProperty({
    description: 'The accountId',
    example: 'NOVO-DEN-14-3',
  })
  @IsString({ message: 'AccountId must be a valid string.' })
  accountId: string;

  @ApiProperty({
    description: 'The currency symbol (e.g., USD, EUR)',
    example: 'EUR',
  })
  @IsString({ message: 'currency must be a valid string.' })
  currency: string;

  @ApiProperty({
    description: 'Max free transactions per billing period e.g 100',
    example: 100,
  })
  @IsNumber({}, { message: 'transactionThreshold must be a valid number.' })
  @Min(1, { message: 'transactionThreshold must be at least 1.' })
  transactionThreshold!: number;

  @ApiProperty({
    description: 'The number of discounted days on new accounts e.g 7, 10, 30',
    example: 7,
  })
  @IsNumber({}, { message: 'discountedDays must be a valid number.' })
  @Min(0, { message: 'discountedDays must be greater than or equal to 0.' })
  discountedDays: number;

  @ApiProperty({
    description: 'The discount rate applied to the base fee e.g 10 for 10%',
    example: 10,
  })
  @IsNumber({}, { message: 'discountedDays must be a valid number.' })
  @Min(0, { message: 'discountedRate must be greater than or equal to 0.' })
  @Max(100, { message: 'discountedRate must be less than or equal to 100.' })
  discountedRate: number;
}
