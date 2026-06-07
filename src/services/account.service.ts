import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { AccountRequest } from 'src/entities/account-requests.entity';
import { Account } from 'src/entities/account.entity';
import { CreateNewAccountDto } from 'src/dto/create-new-account.dto';
import { parseAccountId } from 'src/utils/account.utils';
import { CalculateAccountBillDto } from 'src/dto/calculate-account-bill.dto';
import { dayjs } from '../utils/day-js.utils';
import { Currency } from 'src/entities/currency.entity';
import { calculateCustomBaseFee } from 'src/utils/account.utils';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AccountRequest)
    private readonly accountRequestRepository: Repository<AccountRequest>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Adds a new currency with the provided details.
   * @param {CreateNewAccountDto} createNewAccountDto - The data for the new account
   * @returns {Promise<any>} A message indicating success or failure of the operation
   * @description This creates a new account if new account request was submitted by client before
   * @throws {Error} If any error occurs during the operation
   */
  async postCreateNewAccount(
    createNewAccountDto: CreateNewAccountDto,
  ): Promise<any> {
    try {
      // Parse accountId to get [businessShortName, country, currency, userId, requestId]
      const parsedAccount = parseAccountId(createNewAccountDto.accountId);
      if (!parsedAccount) {
        throw new BadRequestException('Invalid accountId format!');
      }

      const userId = parsedAccount[2];
      const requestId = parsedAccount[3];

      // Check if account request (requestId) exists
      const accountRequest = await this.accountRequestRepository.findOne({
        where: { id: requestId, userId: userId },
      });

      if (!accountRequest) {
        throw new BadRequestException(
          'Account request with requestId ${requestId} or userId ${userId} not found!',
        );
      }

      // Verify currency matches between DTO and account request
      if (createNewAccountDto.currency !== accountRequest.currency) {
        throw new BadRequestException(
          'Currency in accountId does not match the currency in account request!',
        );
      }

      // Check if an approved account request already exists for this user and currency
      if (accountRequest.status == 'approved') {
        throw new BadRequestException(
          `An account with currency ${createNewAccountDto.currency} already exists for this user!`,
        );
      }

      // Create and save new account
      const newAccount = this.accountRepository.create({
        ...createNewAccountDto,
        discountValid:
          createNewAccountDto.discountedDays <= 0 &&
          createNewAccountDto.discountedRate <= 0
            ? false
            : true,
      });

      await this.accountRepository.save(newAccount);

      // Update account request status to approved
      accountRequest.status = 'approved';
      await this.accountRequestRepository.save(accountRequest);

      return {
        message: 'Account created successfully!',
        accountId: newAccount.accountId,
        id: newAccount.id,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('Error creating account:', error);
      throw new InternalServerErrorException('Error creating account!');
    }
  }

  /**
   * Adds a new currency with the provided details.
   * @param {CalculateAccountBillDto} calculateAccountBillDto - The data for the new account
   * @returns {Promise<any>} A message indicating success or failure of the operation
   * @description This calculates an account bill for a specified period
   * @throws {Error} If any error occurs during the operation
   */
  async calculateAccountBill(
    calculateAccountBillDto: CalculateAccountBillDto,
    accountId: string,
  ): Promise<any> {
    try {
      // verify if account exists in accounts table (entity)
      // Check if account request (requestId) exists
      const accountInDB = await this.accountRepository.findOne({
        where: { accountId: accountId },
      });

      if (!accountInDB) {
        throw new BadRequestException(
          'Account request with accountId ${accountId} was not found!',
        );
      }

      const billingPeriodStart = dayjs
        .utc(calculateAccountBillDto.billingPeriodStart)
        .unix();

      // verify if start date is greater or equals to the date when the account
      if (billingPeriodStart < accountInDB.createdAt) {
        throw new BadRequestException(
          'billingPeriodStart needs to be after the account was created!',
        );
      }

      const currencyInDB = await this.currencyRepository.findOne({
        where: { currency: accountInDB.currency },
      });

      if (!currencyInDB) {
        throw new InternalServerErrorException('Error searching for currency!');
      }

      const basePeriodFeeGbp = calculateCustomBaseFee(
        calculateAccountBillDto.billingPeriodStart,
        calculateAccountBillDto.billingPeriodEnd,
        currencyInDB.monthlyFeeGbp,
        accountInDB.discountedRate,
        accountInDB.discountedDays,
      );

      const transactionCountThreshold: number = Number(
        this.configService.get('TRANSACTION_COUNT_THRESHOLD'),
      );

      // calucalte access fee (threshold)
      let transactionFeeGbp: number;
      if (
        calculateAccountBillDto.transactionCount > transactionCountThreshold
      ) {
        transactionFeeGbp =
          (calculateAccountBillDto.transactionCount -
            transactionCountThreshold) *
          Number(this.configService.get('FIXED_TRANSACTION_FEE'));
      } else {
        transactionFeeGbp = 0;
      }

      const baseFeeDiscount =
        basePeriodFeeGbp.totalBeforeDiscount -
        basePeriodFeeGbp.totalOwedWithDiscount;

      const totalFeesGbp = (
        basePeriodFeeGbp.totalOwedWithDiscount + transactionFeeGbp
      ).toFixed(2);

      return {
        totalBaseFee: basePeriodFeeGbp.totalBeforeDiscount,
        baseFeeDiscount: -baseFeeDiscount,
        totalTransactionFeeGbp: transactionFeeGbp,
        totalFeesGbp: totalFeesGbp,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('Error creating account:', error);
      throw new InternalServerErrorException('Error creating account!');
    }
  }
}
