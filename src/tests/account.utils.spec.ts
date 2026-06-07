import {
  validateAccountId,
  parseAccountId,
  calculateCustomBaseFee,
} from '../utils/account.utils';
import { dayjs } from '../utils/day-js.utils';

// Account created 2026-06-07 → billing eligible from 2026-06-08
// Discount window (7 days, 10%): 2026-06-08 → 2026-06-14 inclusive
// monthlyFeeGbp=3000 with June (30 days) → exact daily rate of 100
// monthlyFeeGbp=3100 with July (31 days) → exact daily rate of 100
const CREATED_AT = dayjs.utc('2026-06-07').startOf('day').valueOf();

// ─── validateAccountId ────────────────────────────────────────────────────────

describe('validateAccountId', () => {
  describe('valid inputs', () => {
    it('returns true for a correctly formatted accountId', () => {
      expect(validateAccountId('NOVO-DEN-3-1')).toBe(true);
    });

    it('returns true with multi-digit clientId and requestId', () => {
      expect(validateAccountId('BCB-GBR-100-50')).toBe(true);
    });

    it('returns true with single-character business name and country', () => {
      expect(validateAccountId('A-B-1-1')).toBe(true);
    });
  });

  describe('invalid format — wrong number of parts', () => {
    it('returns false for an empty string', () => {
      expect(validateAccountId('')).toBe(false);
    });

    it('returns false when only 3 parts are provided', () => {
      expect(validateAccountId('NOVO-DEN-3')).toBe(false);
    });

    it('returns false when 5 parts are provided', () => {
      expect(validateAccountId('NOVO-DEN-3-1-EXTRA')).toBe(false);
    });
  });

  describe('invalid format — empty segments', () => {
    it('returns false when businessShortName is empty', () => {
      expect(validateAccountId('-DEN-3-1')).toBe(false);
    });

    it('returns false when country is empty', () => {
      expect(validateAccountId('NOVO--3-1')).toBe(false);
    });
  });

  describe('invalid format — clientId constraints', () => {
    it('returns false when clientId is not a number', () => {
      expect(validateAccountId('NOVO-DEN-abc-1')).toBe(false);
    });

    it('returns false when clientId is zero', () => {
      expect(validateAccountId('NOVO-DEN-0-1')).toBe(false);
    });

    it('returns false when clientId is a float', () => {
      expect(validateAccountId('NOVO-DEN-1.5-1')).toBe(false);
    });
  });

  describe('invalid format — requestId constraints', () => {
    it('returns false when requestId is not a number', () => {
      expect(validateAccountId('NOVO-DEN-3-abc')).toBe(false);
    });

    it('returns false when requestId is zero', () => {
      expect(validateAccountId('NOVO-DEN-3-0')).toBe(false);
    });

    it('returns false when requestId is a float', () => {
      expect(validateAccountId('NOVO-DEN-3-1.5')).toBe(false);
    });
  });
});

// ─── parseAccountId ───────────────────────────────────────────────────────────

describe('parseAccountId', () => {
  describe('valid inputs', () => {
    it('parses a valid accountId into the correct tuple', () => {
      expect(parseAccountId('NOVO-DEN-3-1')).toEqual(['NOVO', 'DEN', 3, 1]);
    });

    it('preserves businessShortName and country as strings', () => {
      const result = parseAccountId('BCB-GBR-100-50');
      expect(result?.[0]).toBe('BCB');
      expect(result?.[1]).toBe('GBR');
    });

    it('converts clientId to a number', () => {
      const result = parseAccountId('NOVO-DEN-3-1');
      expect(typeof result?.[2]).toBe('number');
      expect(result?.[2]).toBe(3);
    });

    it('converts requestId to a number', () => {
      const result = parseAccountId('NOVO-DEN-3-1');
      expect(typeof result?.[3]).toBe('number');
      expect(result?.[3]).toBe(1);
    });

    it('correctly parses multi-digit numeric ids', () => {
      expect(parseAccountId('BCB-GBR-100-50')).toEqual(['BCB', 'GBR', 100, 50]);
    });
  });

  describe('invalid inputs', () => {
    it('returns null for an empty string', () => {
      expect(parseAccountId('')).toBeNull();
    });

    it('returns null when the format has too few parts', () => {
      expect(parseAccountId('NOVO-DEN-3')).toBeNull();
    });

    it('returns null when the format has too many parts', () => {
      expect(parseAccountId('NOVO-DEN-3-1-EXTRA')).toBeNull();
    });

    it('returns null when clientId is non-numeric', () => {
      expect(parseAccountId('NOVO-DEN-abc-1')).toBeNull();
    });

    it('returns null when requestId is zero', () => {
      expect(parseAccountId('NOVO-DEN-3-0')).toBeNull();
    });

    it('returns null when clientId is a float', () => {
      expect(parseAccountId('NOVO-DEN-1.5-1')).toBeNull();
    });
  });
});

// ─── calculateCustomBaseFee ───────────────────────────────────────────────────

describe('calculateCustomBaseFee', () => {
  describe('full discount — billing period entirely within the discount window', () => {
    it('discounts every day when billing covers the exact discount window', () => {
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

    it('applies discount for a single day on the first day of the window', () => {
      const result = calculateCustomBaseFee(
        '2026-06-08',
        '2026-06-08',
        3000,
        10,
        7,
        CREATED_AT,
      );

      expect(result.totalBeforeDiscount).toBe(100);
      expect(result.totalOwedWithDiscount).toBe(90);
      expect(result.totalSaved).toBe(10);
    });

    it('applies discount for a single day on the last day of the window', () => {
      const result = calculateCustomBaseFee(
        '2026-06-14',
        '2026-06-14',
        3000,
        10,
        7,
        CREATED_AT,
      );

      expect(result.totalBeforeDiscount).toBe(100);
      expect(result.totalOwedWithDiscount).toBe(90);
      expect(result.totalSaved).toBe(10);
    });
  });

  describe('no discount — billing period entirely outside the discount window', () => {
    it('applies no discount when billing starts after the window ends', () => {
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

    it('applies no discount when billing starts the day after the window ends', () => {
      const result = calculateCustomBaseFee(
        '2026-06-15',
        '2026-06-22',
        3000,
        10,
        7,
        CREATED_AT,
      );

      expect(result.totalBeforeDiscount).toBe(800);
      expect(result.totalOwedWithDiscount).toBe(800);
      expect(result.totalSaved).toBe(0);
    });

    it('does not discount the account creation day itself', () => {
      // Creation day 2026-06-07 is not part of the discount window (window starts 2026-06-08)
      const result = calculateCustomBaseFee(
        '2026-06-07',
        '2026-06-07',
        3000,
        10,
        7,
        CREATED_AT,
      );

      expect(result.totalBeforeDiscount).toBe(100);
      expect(result.totalOwedWithDiscount).toBe(100);
      expect(result.totalSaved).toBe(0);
    });
  });

  describe('partial discount — billing period partially overlaps the discount window', () => {
    it('discounts only days inside the window when billing extends beyond it', () => {
      // Billing: 2026-06-08→2026-06-17 (10 days)
      // Discounted: 2026-06-08→2026-06-14 (7 days), Full: 2026-06-15→2026-06-17 (3 days)
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

    it('discounts only days inside the window when billing starts before it', () => {
      // Billing: 2026-06-07→2026-06-10 (4 days)
      // Full-rate: 2026-06-07 (1 day), Discounted: 2026-06-08→2026-06-10 (3 days)
      const result = calculateCustomBaseFee(
        '2026-06-07',
        '2026-06-10',
        3000,
        10,
        7,
        CREATED_AT,
      );

      expect(result.totalBeforeDiscount).toBe(400);
      expect(result.totalOwedWithDiscount).toBe(370); // 1*100 + 3*90
      expect(result.totalSaved).toBe(30);
    });

    it('discounts only days inside the window when billing period straddles the end boundary', () => {
      // Billing: 2026-06-10→2026-06-17 (8 days)
      // Discounted: 2026-06-10→2026-06-14 (5 days), Full: 2026-06-15→2026-06-17 (3 days)
      const result = calculateCustomBaseFee(
        '2026-06-10',
        '2026-06-17',
        3000,
        10,
        7,
        CREATED_AT,
      );

      expect(result.totalBeforeDiscount).toBe(800);
      expect(result.totalOwedWithDiscount).toBe(750); // 5*90 + 3*100
      expect(result.totalSaved).toBe(50);
    });
  });

  describe('discount rate edge cases', () => {
    it('applies 100% discount — totalOwedWithDiscount is 0 for days in the window', () => {
      const result = calculateCustomBaseFee(
        '2026-06-08',
        '2026-06-14',
        3000,
        100,
        7,
        CREATED_AT,
      );

      expect(result.totalBeforeDiscount).toBe(700);
      expect(result.totalOwedWithDiscount).toBe(0);
      expect(result.totalSaved).toBe(700);
    });

    it('applies no savings when discountRate is 0%', () => {
      const result = calculateCustomBaseFee(
        '2026-06-08',
        '2026-06-14',
        3000,
        0,
        7,
        CREATED_AT,
      );

      expect(result.totalBeforeDiscount).toBe(700);
      expect(result.totalOwedWithDiscount).toBe(700);
      expect(result.totalSaved).toBe(0);
    });

    it('applies no discount when discountedDays is 0 (empty window)', () => {
      // discStart = 2026-06-08, discEnd = 2026-06-07 end-of-day → no valid window
      const result = calculateCustomBaseFee(
        '2026-06-08',
        '2026-06-14',
        3000,
        10,
        0,
        CREATED_AT,
      );

      expect(result.totalBeforeDiscount).toBe(700);
      expect(result.totalOwedWithDiscount).toBe(700);
      expect(result.totalSaved).toBe(0);
    });
  });

  describe('return value structure and precision', () => {
    it('returns an object with all three required fields', () => {
      const result = calculateCustomBaseFee(
        '2026-06-08',
        '2026-06-14',
        3000,
        10,
        7,
        CREATED_AT,
      );

      expect(result).toHaveProperty('totalBeforeDiscount');
      expect(result).toHaveProperty('totalOwedWithDiscount');
      expect(result).toHaveProperty('totalSaved');
    });

    it('returns all fields as numbers', () => {
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
    });

    it('rounds all return values to 2 decimal places', () => {
      // 1000 / 31 (July days) = non-terminating decimal → tests rounding behaviour
      const result = calculateCustomBaseFee(
        '2026-07-01',
        '2026-07-01',
        1000,
        10,
        7,
        CREATED_AT,
      );

      const hasAtMostTwoDecimals = (n: number) =>
        parseFloat(n.toFixed(2)) === n;

      expect(hasAtMostTwoDecimals(result.totalBeforeDiscount)).toBe(true);
      expect(hasAtMostTwoDecimals(result.totalOwedWithDiscount)).toBe(true);
      expect(hasAtMostTwoDecimals(result.totalSaved)).toBe(true);
    });

    it('totalSaved equals totalBeforeDiscount minus totalOwedWithDiscount', () => {
      const result = calculateCustomBaseFee(
        '2026-06-08',
        '2026-06-17',
        3000,
        15,
        7,
        CREATED_AT,
      );

      expect(result.totalSaved).toBeCloseTo(
        result.totalBeforeDiscount - result.totalOwedWithDiscount,
        2,
      );
    });

    it('totalOwedWithDiscount is never greater than totalBeforeDiscount', () => {
      const result = calculateCustomBaseFee(
        '2026-06-08',
        '2026-06-14',
        3000,
        10,
        7,
        CREATED_AT,
      );

      expect(result.totalOwedWithDiscount).toBeLessThanOrEqual(
        result.totalBeforeDiscount,
      );
    });

    it('totalSaved is never negative', () => {
      const result = calculateCustomBaseFee(
        '2026-06-08',
        '2026-06-14',
        3000,
        10,
        7,
        CREATED_AT,
      );

      expect(result.totalSaved).toBeGreaterThanOrEqual(0);
    });
  });
});
