# API User Flow

Describes the sequence of operations for the BCB Group Billing API. All protected endpoints require `Authorization: Bearer <token>`.

---

## Roles

| Role | Assigned by | Access |
|---|---|---|
| **Admin** | Email domain matches `SUPPORTED_DOMAINS` (e.g. `@bcbgroup.com`) | Currencies, accounts, billing |
| **Customer** | Any other email domain | Account requests only |

---

## Flow

### 1. Sign up — `POST /user/signup`
Both roles register here. Role is assigned automatically from the email domain.

### 2. Sign in — `POST /user/signin`
Returns a JWT bearer token used on all subsequent protected requests.

### 3. Admin adds a currency — `POST /currencies`
Registers a supported currency and its monthly GBP base fee. Must be done before any account can reference it.

### 4. Customer requests an account — `POST /user/new-account-request`
Customer submits a request for a specific currency. One pending/approved request allowed per currency per customer.

### 5. Admin creates the account — `POST /accounts`
Admin approves by creating the account using an `accountId` that encodes the customer and request:

```
Format:  BusinessShortName-CountryOfOrigin-ClientId-RequestId
Example: NOVO-DEN-3-2  →  Novo Nordisk, Denmark, Client #3, Request #2
```

The account request status is updated to `approved` on success.

### 6. Admin generates a bill — `POST /accounts/:accountId/bill`
Admin provides a billing period and transaction count. Returns an itemized breakdown:

```json
{
  "accountId": "NOVO-DEN-3-2",
  "totalAmountGbp": 12.75,
  "breakdown": {
    "baseFeeGbp": 15.00,
    "transactionFeesGbp": 0.00,
    "grossTotalGbp": 15.00,
    "discountAppliedGbp": 2.25,
    "discountDetails": "15% off applied"
  }
}
```

> **Billing notes:**
> - Base fee is pro-rated daily from the currency's monthly fee.
> - Discount applies only to days within the account's promotional window (starts the day after account creation).
> - Transactions exceeding `transactionThreshold` incur a flat per-transaction fee.

---

> **Note:** _Customer_ and _Client_ are used interchangeably throughout this project.
