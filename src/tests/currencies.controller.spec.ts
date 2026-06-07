import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CurrenciesController } from '../controllers/currencies.controller';
import { CurrenciesService } from '../services/currencies.service';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AddNewCurrencyDto } from '../dto/add-new-currency.dto';

const PASS_THROUGH_GUARD = { canActivate: () => true };

describe('CurrenciesController', () => {
  let controller: CurrenciesController;
  let service: jest.Mocked<Pick<CurrenciesService, 'postAddNewCurrency'>>;

  beforeEach(async () => {
    const mockService = { postAddNewCurrency: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CurrenciesController],
      providers: [{ provide: CurrenciesService, useValue: mockService }],
    })
      .overrideGuard(AuthGuard)
      .useValue(PASS_THROUGH_GUARD)
      .overrideGuard(RolesGuard)
      .useValue(PASS_THROUGH_GUARD)
      .compile();

    controller = module.get(CurrenciesController);
    service = module.get(CurrenciesService);
  });

  describe('addNewCurrency', () => {
    it('calls postAddNewCurrency with the full DTO and returns the service response', async () => {
      const dto: AddNewCurrencyDto = { currency: 'USD', monthlyFeeGbp: 1800 };
      service.postAddNewCurrency.mockResolvedValue({
        message: 'Currency added successfully!',
      });

      await expect(controller.addNewCurrency(dto)).resolves.toEqual({
        message: 'Currency added successfully!',
      });
      expect(service.postAddNewCurrency).toHaveBeenCalledWith(dto);
    });

    it('delegates to the service for a lowercase symbol (currency-symbol-map is case-insensitive)', async () => {
      const dto: AddNewCurrencyDto = { currency: 'usd', monthlyFeeGbp: 1800 };
      service.postAddNewCurrency.mockResolvedValue({
        message: 'Currency added successfully!',
      });

      await expect(controller.addNewCurrency(dto)).resolves.not.toThrow();
      expect(service.postAddNewCurrency).toHaveBeenCalledWith(dto);
    });

    it('throws BadRequestException with "Currency not available!" and does not call the service for an unrecognised symbol', () => {
      const dto: AddNewCurrencyDto = {
        currency: 'INVALID',
        monthlyFeeGbp: 1800,
      };

      expect(() => controller.addNewCurrency(dto)).toThrow(BadRequestException);
      expect(() => controller.addNewCurrency(dto)).toThrow(
        'Currency not available!',
      );
      expect(service.postAddNewCurrency).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for an empty string currency', () => {
      const dto: AddNewCurrencyDto = { currency: '', monthlyFeeGbp: 1800 };

      expect(() => controller.addNewCurrency(dto)).toThrow(BadRequestException);
    });

    it('propagates BadRequestException from the service', async () => {
      const dto: AddNewCurrencyDto = { currency: 'USD', monthlyFeeGbp: 1800 };
      service.postAddNewCurrency.mockRejectedValue(
        new BadRequestException('Currency already exists!'),
      );

      await expect(controller.addNewCurrency(dto)).rejects.toThrow(
        'Currency already exists!',
      );
    });

    it('propagates InternalServerErrorException from the service', async () => {
      const dto: AddNewCurrencyDto = { currency: 'USD', monthlyFeeGbp: 1800 };
      service.postAddNewCurrency.mockRejectedValue(
        new InternalServerErrorException('Error adding currency!'),
      );

      await expect(controller.addNewCurrency(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
