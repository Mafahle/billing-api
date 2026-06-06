import { IsString, IsNumber } from 'class-validator';
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
    description: 'The number of discounted days on new accounts e.g 7, 10, 30',
    example: 7,
  })
  @IsNumber({}, { message: 'discountedDays must be a valid number.' })
  discountedDays: number;

  @ApiProperty({
    description: 'The discount rate applied to the base fee e.g 10 for 10%',
    example: 10,
  })
  @IsNumber({}, { message: 'discountedDays must be a valid number.' })
  discountedRate: number;
}
