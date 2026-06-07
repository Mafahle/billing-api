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

  // ─── addNewCurrency ─────────────────────────────────────────────────────────

  describe('addNewCurrency', () => {
    describe('valid currency symbol — delegates to service', () => {
      it('calls postAddNewCurrency with the full DTO', async () => {
        const dto: AddNewCurrencyDto = { currency: 'USD', monthlyFeeGbp: 1800 };
        service.postAddNewCurrency.mockResolvedValue({
          message: 'Currency added successfully!',
        });

        await controller.addNewCurrency(dto);

        expect(service.postAddNewCurrency).toHaveBeenCalledWith(dto);
        expect(service.postAddNewCurrency).toHaveBeenCalledTimes(1);
      });

      it('returns the service success response', async () => {
        const dto: AddNewCurrencyDto = { currency: 'EUR', monthlyFeeGbp: 1500 };
        service.postAddNewCurrency.mockResolvedValue({
          message: 'Currency added successfully!',
        });

        await expect(controller.addNewCurrency(dto)).resolves.toEqual({
          message: 'Currency added successfully!',
        });
      });

      it('accepts GBP as a valid currency symbol', async () => {
        const dto: AddNewCurrencyDto = { currency: 'GBP', monthlyFeeGbp: 1000 };
        service.postAddNewCurrency.mockResolvedValue({
          message: 'Currency added successfully!',
        });

        await expect(controller.addNewCurrency(dto)).resolves.not.toThrow();
      });

      it('accepts CHF as a valid currency symbol', async () => {
        const dto: AddNewCurrencyDto = { currency: 'CHF', monthlyFeeGbp: 1200 };
        service.postAddNewCurrency.mockResolvedValue({
          message: 'Currency added successfully!',
        });

        await expect(controller.addNewCurrency(dto)).resolves.not.toThrow();
      });

      it('accepts JPY as a valid currency symbol', async () => {
        const dto: AddNewCurrencyDto = { currency: 'JPY', monthlyFeeGbp: 2000 };
        service.postAddNewCurrency.mockResolvedValue({
          message: 'Currency added successfully!',
        });

        await expect(controller.addNewCurrency(dto)).resolves.not.toThrow();
      });

      it('passes monthlyFeeGbp value through to the service unchanged', async () => {
        const dto: AddNewCurrencyDto = { currency: 'USD', monthlyFeeGbp: 9999 };
        service.postAddNewCurrency.mockResolvedValue({
          message: 'Currency added successfully!',
        });

        await controller.addNewCurrency(dto);

        expect(service.postAddNewCurrency).toHaveBeenCalledWith(
          expect.objectContaining({ monthlyFeeGbp: 9999 }),
        );
      });
    });

    describe('invalid currency symbol — throws before reaching the service', () => {
      it('throws BadRequestException for an unrecognised currency symbol', () => {
        const dto: AddNewCurrencyDto = {
          currency: 'INVALID',
          monthlyFeeGbp: 1800,
        };

        expect(() => controller.addNewCurrency(dto)).toThrow(
          BadRequestException,
        );
      });

      it('throws with the message "Currency not available!"', () => {
        const dto: AddNewCurrencyDto = { currency: 'XYZ', monthlyFeeGbp: 1800 };

        expect(() => controller.addNewCurrency(dto)).toThrow(
          'Currency not available!',
        );
      });

      it('does not call the service when the currency is invalid', () => {
        const dto: AddNewCurrencyDto = {
          currency: 'FAKE',
          monthlyFeeGbp: 1800,
        };

        try {
          controller.addNewCurrency(dto);
        } catch {
          // expected throw
        }

        expect(service.postAddNewCurrency).not.toHaveBeenCalled();
      });

      it('delegates to the service for a lowercase currency symbol (currency-symbol-map is case-insensitive)', async () => {
        const dto: AddNewCurrencyDto = { currency: 'usd', monthlyFeeGbp: 1800 };
        service.postAddNewCurrency.mockResolvedValue({
          message: 'Currency added successfully!',
        });

        await expect(controller.addNewCurrency(dto)).resolves.not.toThrow();
        expect(service.postAddNewCurrency).toHaveBeenCalledWith(dto);
      });

      it('throws BadRequestException for an empty string currency', () => {
        const dto: AddNewCurrencyDto = { currency: '', monthlyFeeGbp: 1800 };

        expect(() => controller.addNewCurrency(dto)).toThrow(
          BadRequestException,
        );
      });

      it('throws BadRequestException for a numeric string currency', () => {
        const dto: AddNewCurrencyDto = { currency: '123', monthlyFeeGbp: 1800 };

        expect(() => controller.addNewCurrency(dto)).toThrow(
          BadRequestException,
        );
      });
    });

    describe('service error propagation', () => {
      it('propagates BadRequestException when the currency already exists', async () => {
        const dto: AddNewCurrencyDto = { currency: 'USD', monthlyFeeGbp: 1800 };
        service.postAddNewCurrency.mockRejectedValue(
          new BadRequestException('Currency already exists!'),
        );

        await expect(controller.addNewCurrency(dto)).rejects.toThrow(
          BadRequestException,
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

      it('still validates the currency symbol before reaching an erroring service', () => {
        // Service is set up to fail, but the invalid symbol should throw first
        const dto: AddNewCurrencyDto = {
          currency: 'INVALID',
          monthlyFeeGbp: 1800,
        };
        service.postAddNewCurrency.mockRejectedValue(
          new InternalServerErrorException('should not reach here'),
        );

        expect(() => controller.addNewCurrency(dto)).toThrow(
          BadRequestException,
        );
        expect(service.postAddNewCurrency).not.toHaveBeenCalled();
      });
    });
  });
});
