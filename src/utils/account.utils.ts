import { dayjs } from './day-js.utils';

/**
 * Account ID Format: EUR-DEN-CHF-3-1
 * NOVO - Business short name e.g NOVO for Novo Nordisk (string)
 * DEN - Country of residence (string)
 * 3 - ClientId (number)
 * 1 - New Account Request id (number)
 */

/**
 * Validates if the provided accountId matches the expected format.
 * @param {accountId} - The account ID string to validate
 * @returns true if valid, false otherwise
 */
export function validateAccountId(accountId: string): boolean {
  if (!accountId || typeof accountId !== 'string') {
    return false;
  }

  const parts = accountId.split('-');

  // Must have exactly 4 parts
  if (parts.length !== 4) {
    return false;
  }

  const [businessShortName, country, clientId, requestId] = parts;

  // businessShortName, country, and currency must be non-empty strings
  if (!businessShortName || !country) {
    return false;
  }

  // ClientId and RequestId must be valid positive integers
  const clientIdNum = Number(clientId);
  const requestIdNum = Number(requestId);

  if (
    isNaN(clientIdNum) ||
    isNaN(requestIdNum) ||
    !Number.isInteger(clientIdNum) ||
    !Number.isInteger(requestIdNum) ||
    clientIdNum <= 0 ||
    requestIdNum <= 0
  ) {
    return false;
  }

  return true;
}

/**
 * Parses accountId and returns an array with the last two elements formatted as numbers.
 * @param {accountId} - The account ID string to parse
 * @returns Array [businessShortName, country, currency, clientId, requestId] or null if invalid
 */
export function parseAccountId(
  accountId: string,
): [string, string, number, number] | null {
  if (!validateAccountId(accountId)) {
    return null;
  }

  const parts = accountId.split('-');
  const [businessShortName, country, clientId, requestId] = parts;

  return [businessShortName, country, Number(clientId), Number(requestId)];
}

// Define a structured return interface for clear API documentation
export interface BillingBreakdown {
  totalBeforeDiscount: number;
  totalOwedWithDiscount: number;
  totalSaved: number;
}

/**
 * Calculates custom period fees, returning a detailed breakdown of costs and savings.
 * The continuous discount block automatically triggers at the start of the billing period.
 *
 * @param {startDateIso} ISO string of the billing start date (e.g., '2026-03-31')
 * @param {endDateIso} ISO string of the billing end date (e.g., '2026-09-10')
 * @param {monthlyBaseFee} The standard flat monthly fee amount
 * @param {discountRate} The percentage discount to apply (e.g., 20 for a 20% discount)
 * @param {discountedDays} The total number of continuous discount days starting from day one (e.g., 10)
 */
export function calculateCustomBaseFee(
  startDateIso: string,
  endDateIso: string,
  monthlyBaseFee: number,
  discountRate: number,
  discountedDays: number,
): BillingBreakdown {
  const start = dayjs.utc(startDateIso).startOf('day');
  const end = dayjs.utc(endDateIso).endOf('day');

  // Establish the boundaries of the discount block using the billing start date
  const discStartUnix = start.unix();
  // Subtract 1 because day one of the billing cycle counts as the first discounted day
  const discEndUnix = start
    .add(discountedDays - 1, 'day')
    .endOf('day')
    .unix();

  const totalBillingDays = end.diff(start, 'day') + 1;

  let totalBeforeDiscount = 0;
  let totalOwedWithDiscount = 0;
  let rollingDate = start;

  // Iterate through every single day individually
  for (let i = 0; i < totalBillingDays; i++) {
    const daysInCurrentMonth = rollingDate.daysInMonth();
    const baseDailyRate = monthlyBaseFee / daysInCurrentMonth;

    // Track standard cost regardless of promotion status
    totalBeforeDiscount += baseDailyRate;

    const currentDayUnix = rollingDate.unix();

    // Check if the current day falls inclusively inside the active discount range
    if (currentDayUnix >= discStartUnix && currentDayUnix <= discEndUnix) {
      const discountedDailyRate = baseDailyRate * (1 - discountRate / 100);
      totalOwedWithDiscount += discountedDailyRate;
    } else {
      totalOwedWithDiscount += baseDailyRate;
    }

    rollingDate = rollingDate.add(1, 'day');
  }

  // Calculate total savings
  const totalSaved = totalBeforeDiscount - totalOwedWithDiscount;

  return {
    totalBeforeDiscount: parseFloat(totalBeforeDiscount.toFixed(2)),
    totalOwedWithDiscount: parseFloat(totalOwedWithDiscount.toFixed(2)),
    totalSaved: parseFloat(totalSaved.toFixed(2)),
  };
}
