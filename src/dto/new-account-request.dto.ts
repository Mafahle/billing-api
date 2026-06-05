import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NewAccountRequestDto {
  @ApiProperty({
    description: 'The currency symbol (e.g., USD, EUR)',
    example: 'EUR',
  })
  @IsString({ message: 'Currency must be a valid string.' })
  currency: string;
}
