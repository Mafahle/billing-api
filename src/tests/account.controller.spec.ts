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
    describe('valid accountId — delegates to service', () => {
      it('calls postCreateNewAccount with the full DTO', async () => {
        service.postCreateNewAccount.mockResolvedValue({
          message: 'Account created successfully!',
          accountId: VALID_ACCOUNT_ID,
          id: 1,
        });

        await controller.createNewAccount(BASE_CREATE_DTO);

        expect(service.postCreateNewAccount).toHaveBeenCalledWith(
          BASE_CREATE_DTO,
        );
        expect(service.postCreateNewAccount).toHaveBeenCalledTimes(1);
      });

      it('returns the service success response', async () => {
        const successResponse = {
          message: 'Account created successfully!',
          accountId: VALID_ACCOUNT_ID,
          id: 1,
        };
        service.postCreateNewAccount.mockResolvedValue(successResponse);

        await expect(
          controller.createNewAccount(BASE_CREATE_DTO),
        ).resolves.toEqual(successResponse);
      });
    });

    describe('invalid accountId — throws before reaching the service', () => {
      it('throws BadRequestException for a malformed accountId', () => {
        const dto: CreateNewAccountDto = {
          ...BASE_CREATE_DTO,
          accountId: 'INVALID',
        };

        expect(() => controller.createNewAccount(dto)).toThrow(
          BadRequestException,
        );
      });

      it('throws with the message "accountId provided is not valid!"', () => {
        const dto: CreateNewAccountDto = {
          ...BASE_CREATE_DTO,
          accountId: 'BAD',
        };

        expect(() => controller.createNewAccount(dto)).toThrow(
          'accountId provided is not valid!',
        );
      });

      it('does not call the service when accountId fails validation', () => {
        const dto: CreateNewAccountDto = {
          ...BASE_CREATE_DTO,
          accountId: 'NOVO-DEN-0-0',
        };

        try {
          controller.createNewAccount(dto);
        } catch {
          // expected
        }

        expect(service.postCreateNewAccount).not.toHaveBeenCalled();
      });
    });

    describe('service error propagation', () => {
      it('propagates BadRequestException when an account already exists for the user', async () => {
        service.postCreateNewAccount.mockRejectedValue(
          new BadRequestException(
            'An account with currency USD already exists for this user!',
          ),
        );

        await expect(
          controller.createNewAccount(BASE_CREATE_DTO),
        ).rejects.toThrow(BadRequestException);
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
  });

  // ─── calculateAccountBill ────────────────────────────────────────────────────

  describe('calculateAccountBill', () => {
    describe('valid accountId — delegates to service', () => {
      it('calls calculateAccountBill with the DTO and route-param accountId in the correct order', async () => {
        service.calculateAccountBill.mockResolvedValue(BILL_SUCCESS_RESPONSE);

        await controller.calculateAccountBill(VALID_ACCOUNT_ID, BASE_BILL_DTO);

        expect(service.calculateAccountBill).toHaveBeenCalledWith(
          BASE_BILL_DTO,
          VALID_ACCOUNT_ID,
        );
        expect(service.calculateAccountBill).toHaveBeenCalledTimes(1);
      });

      it('returns the full billing breakdown response from the service', async () => {
        service.calculateAccountBill.mockResolvedValue(BILL_SUCCESS_RESPONSE);

        await expect(
          controller.calculateAccountBill(VALID_ACCOUNT_ID, BASE_BILL_DTO),
        ).resolves.toEqual(BILL_SUCCESS_RESPONSE);
      });

      it('passes the route-param accountId to the service, not a value derived from the body', async () => {
        const differentId = 'BCB-GBR-10-5';
        service.calculateAccountBill.mockResolvedValue({
          ...BILL_SUCCESS_RESPONSE,
          accountId: differentId,
        });

        await controller.calculateAccountBill(differentId, BASE_BILL_DTO);

        const [, receivedAccountId] =
          service.calculateAccountBill.mock.calls[0];
        expect(receivedAccountId).toBe(differentId);
      });
    });

    describe('invalid accountId — throws before reaching the service', () => {
      it('throws BadRequestException for a malformed route-param accountId', () => {
        expect(() =>
          controller.calculateAccountBill('INVALID', BASE_BILL_DTO),
        ).toThrow(BadRequestException);
      });

      it('throws with the message "accountId provided is not valid!"', () => {
        expect(() =>
          controller.calculateAccountBill('NOVO-DEN-abc-1', BASE_BILL_DTO),
        ).toThrow('accountId provided is not valid!');
      });

      it('does not call the service when the route-param accountId fails validation', () => {
        try {
          controller.calculateAccountBill('NOVO-DEN-0-1', BASE_BILL_DTO);
        } catch {
          // expected
        }

        expect(service.calculateAccountBill).not.toHaveBeenCalled();
      });
    });

    describe('service error propagation', () => {
      it('propagates BadRequestException when the account does not exist', async () => {
        service.calculateAccountBill.mockRejectedValue(
          new BadRequestException(
            'Account request with accountId was not found!',
          ),
        );

        await expect(
          controller.calculateAccountBill(VALID_ACCOUNT_ID, BASE_BILL_DTO),
        ).rejects.toThrow(BadRequestException);
        await expect(
          controller.calculateAccountBill(VALID_ACCOUNT_ID, BASE_BILL_DTO),
        ).rejects.toThrow('Account request with accountId was not found!');
      });

      it('propagates BadRequestException when billingPeriodStart is before account creation', async () => {
        service.calculateAccountBill.mockRejectedValue(
          new BadRequestException(
            'billingPeriodStart needs to be after the account was created!',
          ),
        );

        await expect(
          controller.calculateAccountBill(VALID_ACCOUNT_ID, BASE_BILL_DTO),
        ).rejects.toThrow(
          'billingPeriodStart needs to be after the account was created!',
        );
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
});
