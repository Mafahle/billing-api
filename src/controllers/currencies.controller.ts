import {
  BadRequestException,
  Body,
  Controller,
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
import { AddNewCurrencyDto } from 'src/dto/add-new-currency.dto';
import { Roles } from 'src/common/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';
import { CurrenciesService } from 'src/services/currencies.service';
import { AuthGuard } from 'src/guards/auth.guard';
import getCurrencySymbol from 'currency-symbol-map';

@ApiTags('Currency')
@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Post('')
  @Roles('admin') // Only admin can add new currencies
  @UseGuards(AuthGuard, RolesGuard) // Ensure user is authenticated and has the admin role
  @ApiBearerAuth()
  @ApiBody({ type: AddNewCurrencyDto })
  @ApiOperation({ summary: 'Add a new currency' })
  @ApiResponse({ status: 201, description: 'Currency created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  addNewCurrency(@Body() addNewCurrencyDto: AddNewCurrencyDto): Promise<any> {
    // Check if currency provided in addNewCurrencyDto is available in currency-symbol-map package.
    const currencySymbol = getCurrencySymbol(addNewCurrencyDto.currency);

    if (!currencySymbol) {
      throw new BadRequestException('Currency not available!');
    }

    return this.currenciesService.postAddNewCurrency(addNewCurrencyDto);
  }
}
