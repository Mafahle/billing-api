import {
  validateAccountId,
  parseAccountId,
  calculateCustomBaseFee,
} from '../utils/account.utils';
import { dayjs } from '../utils/day-js.utils';

// Account created 2026-06-07 → billing eligible from 2026-06-08
// Discount window (7 days, 10%): 2026-06-08 → 2026-06-14 inclusive
// monthlyFeeGbp=3000 with June (30 days) → exact daily rate of 100
const CREATED_AT = dayjs.utc('2026-06-07').startOf('day').valueOf();

// ─── validateAccountId ────────────────────────────────────────────────────────

describe('validateAccountId', () => {
  it('returns true for a correctly formatted accountId', () => {
    expect(validateAccountId('NOVO-DEN-3-1')).toBe(true);
  });

  it('returns false when the wrong number of parts are provided', () => {
    expect(validateAccountId('NOVO-DEN-3')).toBe(false);
    expect(validateAccountId('NOVO-DEN-3-1-EXTRA')).toBe(false);
    expect(validateAccountId('')).toBe(false);
  });

  it('returns false when clientId or requestId are non-numeric or non-positive', () => {
    expect(validateAccountId('NOVO-DEN-abc-1')).toBe(false);
    expect(validateAccountId('NOVO-DEN-3-0')).toBe(false);
  });
});

// ─── parseAccountId ───────────────────────────────────────────────────────────

describe('parseAccountId', () => {
  it('parses a valid accountId into a correctly typed tuple', () => {
    const result = parseAccountId('BCB-GBR-100-50');

    expect(result).toEqual(['BCB', 'GBR', 100, 50]);
    expect(typeof result![2]).toBe('number');
    expect(typeof result![3]).toBe('number');
  });

  it('returns null for any invalid accountId', () => {
    expect(parseAccountId('NOVO-DEN-0-1')).toBeNull();
    expect(parseAccountId('')).toBeNull();
  });
});

// ─── calculateCustomBaseFee ───────────────────────────────────────────────────

describe('calculateCustomBaseFee', () => {
  it('discounts every day when billing falls entirely within the discount window', () => {
    // Window: 2026-06-08 → 2026-06-14 (7 days), daily=100, 10% off
    const result = calculateCustomBaseFee(
      '2026-06-08',
      '2026-06-14',
      3000,
      10,
      7,
      CREATED_AT,
    );

    expect(result.totalBeforeDiscount).toBe(700);
    expect(result.totalOwedWithDiscount).toBe(630);
    expect(result.totalSaved).toBe(70);
  });

  it('applies no discount when billing falls entirely outside the window', () => {
    // Window ends 2026-06-14; billing 2026-07-01→2026-07-10 (10 days, July=31 days)
    // monthlyFeeGbp=3100 → daily=100 exactly
    const result = calculateCustomBaseFee(
      '2026-07-01',
      '2026-07-10',
      3100,
      10,
      7,
      CREATED_AT,
    );

    expect(result.totalBeforeDiscount).toBe(1000);
    expect(result.totalOwedWithDiscount).toBe(1000);
    expect(result.totalSaved).toBe(0);
  });

  it('does not count the account creation day as a discounted day', () => {
    // Billing exactly on creation day (2026-06-07) — window only starts 2026-06-08
    const result = calculateCustomBaseFee(
      '2026-06-07',
      '2026-06-07',
      3000,
      10,
      7,
      CREATED_AT,
    );

    expect(result.totalSaved).toBe(0);
    expect(result.totalOwedWithDiscount).toBe(result.totalBeforeDiscount);
  });

  it('discounts only the days that overlap the window when billing straddles its end boundary', () => {
    // Billing: 2026-06-08→2026-06-17 (10 days); discounted: 7 days, full-rate: 3 days
    const result = calculateCustomBaseFee(
      '2026-06-08',
      '2026-06-17',
      3000,
      10,
      7,
      CREATED_AT,
    );

    expect(result.totalBeforeDiscount).toBe(1000);
    expect(result.totalOwedWithDiscount).toBe(930); // 7*90 + 3*100
    expect(result.totalSaved).toBe(70);
  });

  it('applies 100% discount — totalOwedWithDiscount is 0 for days in the window', () => {
    const result = calculateCustomBaseFee(
      '2026-06-08',
      '2026-06-14',
      3000,
      100,
      7,
      CREATED_AT,
    );

    expect(result.totalOwedWithDiscount).toBe(0);
    expect(result.totalSaved).toBe(result.totalBeforeDiscount);
  });

  it('applies no savings when discountRate is 0% or discountedDays is 0', () => {
    const zeroRate = calculateCustomBaseFee(
      '2026-06-08',
      '2026-06-14',
      3000,
      0,
      7,
      CREATED_AT,
    );
    const zeroDays = calculateCustomBaseFee(
      '2026-06-08',
      '2026-06-14',
      3000,
      10,
      0,
      CREATED_AT,
    );

    expect(zeroRate.totalSaved).toBe(0);
    expect(zeroDays.totalSaved).toBe(0);
  });

  it('returns three numeric fields where totalSaved equals totalBeforeDiscount minus totalOwedWithDiscount', () => {
    const result = calculateCustomBaseFee(
      '2026-06-08',
      '2026-06-14',
      3000,
      10,
      7,
      CREATED_AT,
    );

    expect(typeof result.totalBeforeDiscount).toBe('number');
    expect(typeof result.totalOwedWithDiscount).toBe('number');
    expect(typeof result.totalSaved).toBe('number');
    expect(result.totalSaved).toBeCloseTo(
      result.totalBeforeDiscount - result.totalOwedWithDiscount,
      2,
    );
  });
});
