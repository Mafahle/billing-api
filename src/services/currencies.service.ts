import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from 'src/entities/currency.entity';
import { AddNewCurrencyDto } from 'src/dto/add-new-currency.dto';

@Injectable()
export class CurrenciesService {
  constructor(
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Adds a new currency with the provided details.
   * @param {AddNewCurrencyDto} addNewCurrencyDto - The data for the new currency
   * @param {Response} res - The response object to send the result back to the client
   * @returns {Promise<any>} A message indicating success or failure of the operation
   * @description This method checks if a currency with the provided symbol already exists. If not, it saves the new currency to the database. It returns a success message if the currency is created successfully, or an error message if the currency already exists or if any error occurs during the process.
   * @throws {Error} If any error occurs during the operation
   */
  async postAddNewCurrency(addNewCurrencyDto: AddNewCurrencyDto): Promise<any> {
    try {
      const currencyExists = await this.currencyRepository.findOne({
        where: { currency: addNewCurrencyDto.currency },
      });

      if (currencyExists) {
        throw new BadRequestException('Currency already exists!');
      }

      const newCurrency = this.currencyRepository.create({
        ...addNewCurrencyDto,
        currency: addNewCurrencyDto.currency,
      });
      await this.currencyRepository.save(newCurrency);
      return { message: 'Currency added successfully!' };
    } catch (error) {
      console.error('Error adding currency:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error adding currency!');
    }
  }
}
