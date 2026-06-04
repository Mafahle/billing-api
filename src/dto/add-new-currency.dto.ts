import { IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddNewCurrencyDto {
  @ApiProperty({
    description: 'The currency symbol (e.g., USD, EUR)',
    example: 'EUR',
  })
  @IsString({ message: 'Currency must be a valid string.' })
  currency: string;

  @ApiProperty({
    description: 'The monthly fee in GBP',
    example: 1800,
  })
  @IsNumber()
  @Min(0, { message: 'Monthly fee in GBP must be a positive number.' })
  monthlyFeeGbp: number; // Must be a number
}
