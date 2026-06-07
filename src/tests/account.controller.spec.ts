import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AccountsController } from '../controllers/account.controller';
import { AccountsService } from '../services/account.service';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CreateNewAccountDto } from '../dto/create-new-account.dto';
import { CalculateAccountBillDto } from '../dto/calculate-account-bill.dto';

const PASS_THROUGH_GUARD = { canActivate: () => true };

const VALID_ACCOUNT_ID = 'NOVO-DEN-3-1';

const BASE_CREATE_DTO: CreateNewAccountDto = {
  accountId: VALID_ACCOUNT_ID,
  currency: 'USD',
  transactionThreshold: 100,
  discountedDays: 7,
  discountedRate: 10,
};

const BASE_BILL_DTO: CalculateAccountBillDto = {
  billingPeriodStart: '2026-06-08',
  billingPeriodEnd: '2026-06-30',
  transactionCount: 50,
};

const BILL_SUCCESS_RESPONSE = {
  accountId: VALID_ACCOUNT_ID,
  totalAmountGbp: 2230,
  breakdown: {
    baseFeeGbp: 2300,
    transactionFeesGbp: 0,
    grossTotalGbp: 2300,
    discountAppliedGbp: 70,
    discountDetails: '10% off applied',
  },
};

describe('AccountsController', () => {
  let controller: AccountsController;
  let service: jest.Mocked<
    Pick<AccountsService, 'postCreateNewAccount' | 'calculateAccountBill'>
  >;

  beforeEach(async () => {
    const mockService = {
      postCreateNewAccount: jest.fn(),
      calculateAccountBill: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [{ provide: AccountsService, useValue: mockService }],
    })
      .overrideGuard(AuthGuard)
      .useValue(PASS_THROUGH_GUARD)
      .overrideGuard(RolesGuard)
      .useValue(PASS_THROUGH_GUARD)
      .compile();

    controller = module.get(AccountsController);
    service = module.get(AccountsService);
  });

  // ─── createNewAccount ────────────────────────────────────────────────────────

  describe('createNewAccount', () => {
    it('calls postCreateNewAccount with the full DTO and returns the service response', async () => {
      const successResponse = {
        message: 'Account created successfully!',
        accountId: VALID_ACCOUNT_ID,
        id: 1,
      };
      service.postCreateNewAccount.mockResolvedValue(successResponse);

      await expect(
        controller.createNewAccount(BASE_CREATE_DTO),
      ).resolves.toEqual(successResponse);
      expect(service.postCreateNewAccount).toHaveBeenCalledWith(
        BASE_CREATE_DTO,
      );
    });

    it('throws BadRequestException before calling the service when accountId is invalid', () => {
      const dto: CreateNewAccountDto = {
        ...BASE_CREATE_DTO,
        accountId: 'INVALID',
      };

      expect(() => controller.createNewAccount(dto)).toThrow(
        BadRequestException,
      );
      expect(() => controller.createNewAccount(dto)).toThrow(
        'accountId provided is not valid!',
      );
      expect(service.postCreateNewAccount).not.toHaveBeenCalled();
    });

    it('propagates BadRequestException from the service', async () => {
      service.postCreateNewAccount.mockRejectedValue(
        new BadRequestException(
          'An account with currency USD already exists for this user!',
        ),
      );

      await expect(
        controller.createNewAccount(BASE_CREATE_DTO),
      ).rejects.toThrow(
        'An account with currency USD already exists for this user!',
      );
    });

    it('propagates InternalServerErrorException from the service', async () => {
      service.postCreateNewAccount.mockRejectedValue(
        new InternalServerErrorException('Error creating account!'),
      );

      await expect(
        controller.createNewAccount(BASE_CREATE_DTO),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── calculateAccountBill ────────────────────────────────────────────────────

  describe('calculateAccountBill', () => {
    it('calls calculateAccountBill with the DTO and route-param accountId, and returns the billing breakdown', async () => {
      service.calculateAccountBill.mockResolvedValue(BILL_SUCCESS_RESPONSE);

      await expect(
        controller.calculateAccountBill(VALID_ACCOUNT_ID, BASE_BILL_DTO),
      ).resolves.toEqual(BILL_SUCCESS_RESPONSE);
      expect(service.calculateAccountBill).toHaveBeenCalledWith(
        BASE_BILL_DTO,
        VALID_ACCOUNT_ID,
      );
    });

    it('throws BadRequestException before calling the service when route-param accountId is invalid', () => {
      expect(() =>
        controller.calculateAccountBill('INVALID', BASE_BILL_DTO),
      ).toThrow(BadRequestException);
      expect(() =>
        controller.calculateAccountBill('INVALID', BASE_BILL_DTO),
      ).toThrow('accountId provided is not valid!');
      expect(service.calculateAccountBill).not.toHaveBeenCalled();
    });

    it('propagates BadRequestException from the service', async () => {
      service.calculateAccountBill.mockRejectedValue(
        new BadRequestException(
          'billingPeriodStart needs to be after the account was created!',
        ),
      );

      await expect(
        controller.calculateAccountBill(VALID_ACCOUNT_ID, BASE_BILL_DTO),
      ).rejects.toThrow(BadRequestException);
    });

    it('propagates InternalServerErrorException from the service', async () => {
      service.calculateAccountBill.mockRejectedValue(
        new InternalServerErrorException('Error creating account!'),
      );

      await expect(
        controller.calculateAccountBill(VALID_ACCOUNT_ID, BASE_BILL_DTO),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
