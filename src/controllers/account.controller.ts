import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from 'src/common/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';
import { AuthGuard } from 'src/guards/auth.guard';
import { CreateNewAccountDto } from 'src/dto/create-new-account.dto';
import { validateAccountId } from 'src/utils/account.utils';
import { AccountsService } from 'src/services/account.service';
import { CalculateAccountBillDto } from 'src/dto/calculate-account-bill.dto';

@ApiTags('Account')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post('')
  @Roles('admin') // Only admin can add new currencies
  @UseGuards(AuthGuard, RolesGuard) // Ensure user is authenticated and has the admin role
  @ApiBearerAuth()
  @ApiBody({ type: CreateNewAccountDto })
  @ApiOperation({ summary: 'Create new account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  createNewAccount(
    @Body() createNewAccountDto: CreateNewAccountDto,
  ): Promise<any> {
    // Check if accountId provided has a valid format
    const isAccountId = validateAccountId(createNewAccountDto.accountId);

    if (!isAccountId) {
      throw new BadRequestException('accountId provided is not valid!');
    }

    return this.accountsService.postCreateNewAccount(createNewAccountDto);
  }

  @Post('/:accountId/bill')
  @Roles('admin') // Only admin can add new currencies
  @UseGuards(AuthGuard, RolesGuard) // Ensure user is authenticated and has the admin role
  @ApiBearerAuth()
  @ApiBody({ type: CalculateAccountBillDto })
  @ApiOperation({ summary: 'Calculate account bill' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  calculateAccountBill(
    @Param('accountId') accountId: string,
    @Body() calculateAccountBillDto: CalculateAccountBillDto,
  ): Promise<any> {
    if (!validateAccountId(accountId)) {
      throw new BadRequestException('accountId provided is not valid!');
    }

    return this.accountsService.calculateAccountBill(
      calculateAccountBillDto,
      accountId,
    );
  }
}
