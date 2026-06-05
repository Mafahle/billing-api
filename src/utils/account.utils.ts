/**
 * Account ID Format: EUR-ITA-CHF-3-1
 * EUR - Continent of residence (string)
 * ITA - Country of residence (string)
 * CHF - Currency account type (string)
 * 3 - ClientId (number)
 * 1 - New Account Request id (number)
 */

/**
 * Validates if the provided accountId matches the expected format.
 * @param accountId - The account ID string to validate
 * @returns true if valid, false otherwise
 */
export function validateAccountId(accountId: string): boolean {
  if (!accountId || typeof accountId !== 'string') {
    return false;
  }

  const parts = accountId.split('-');

  // Must have exactly 5 parts
  if (parts.length !== 5) {
    return false;
  }

  const [continent, country, currency, clientId, requestId] = parts;

  // Continent, country, and currency must be non-empty strings
  if (!continent || !country || !currency) {
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
 * @param accountId - The account ID string to parse
 * @returns Array [continent, country, currency, clientId, requestId] or null if invalid
 */
export function parseAccountId(
  accountId: string,
): [string, string, string, number, number] | null {
  if (!validateAccountId(accountId)) {
    return null;
  }

  const parts = accountId.split('-');
  const [continent, country, currency, clientId, requestId] = parts;

  return [continent, country, currency, Number(clientId), Number(requestId)];
}
