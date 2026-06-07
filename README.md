# BCB Group — Billing API

A NestJS/TypeScript service that handles dynamic, per-account billing for BCB BLINC clients. All monetary values are denominated in **GBP (£)**.

---

## Table of Contents

- [BCB Group — Billing API](#bcb-group--billing-api)
  - [Table of Contents](#table-of-contents)
  - [Tech Stack](#tech-stack)
  - [Prerequisites](#prerequisites)
  - [Setup \& Configuration](#setup--configuration)
  - [Project Structure](#project-structure)
  - [Core Functionality](#core-functionality)
    - [User roles](#user-roles)
    - [Authentication flow](#authentication-flow)
    - [Account request flow](#account-request-flow)
    - [Billing calculation](#billing-calculation)
  - [API Endpoints](#api-endpoints)
    - [User](#user)
    - [Currencies](#currencies)
    - [Accounts](#accounts)
  - [Account ID Format](#account-id-format)
  - [Billing Logic](#billing-logic)
    - [Base fee](#base-fee)
    - [Discount window](#discount-window)
    - [Transaction fee](#transaction-fee)
  - [Running the Application](#running-the-application)
  - [Docker](#docker)
  - [API Documentation](#api-documentation)
  - [Tests](#tests)
  - [Deployment](#deployment)
  - [Rate Limiting](#rate-limiting)
  - [License](#license)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11, TypeScript |
| ORM | TypeORM |
| Database (dev) | better-sqlite3 (file-based) |
| Database (test) | better-sqlite3 (in-memory) |
| Database (prod) | PostgreSQL |
| Auth | JWT via `jsonwebtoken` |
| Validation | `class-validator` + `class-transformer` |
| Docs | Scalar (`@scalar/nestjs-api-reference`) |
| Date handling | dayjs (UTC mode) |

---

## Prerequisites

- Node.js >= 20
- npm >= 10 (or pnpm)

---

## Setup & Configuration

**1. Install dependencies**

```bash
npm install
```

**2. Create your environment file**

```bash
cp .env.example .env
```

**3. Configure `.env`**

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `development`, `test`, or `production` |
| `PORT` | No | Server port. Defaults to `3000` |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWT tokens |
| `DB_PATH` | Dev only | Path to the SQLite file. Defaults to `./database/data-dev.db` |
| `DB_URI` | Prod only | PostgreSQL connection URI |
| `DB_PASSWORD` | Prod only | PostgreSQL password |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins. Defaults to `*` |
| `TZ` | No | Timezone for dayjs (e.g., `Africa/Johannesburg`) |
| `SUPPORTED_DOMAINS` | Yes | Comma-separated email domains granted admin role (e.g., `bcbgroup.io,bcbgroup.com`) |
| `FIXED_TRANSACTION_FEE` | Yes | Per-transaction fee (GBP) charged above the account threshold |

**Database is created automatically** via TypeORM `synchronize: true` in development. No manual migration step is needed locally.

---

## Project Structure

```
src/
├── app.module.ts                  # Root module — wires all feature modules
├── main.ts                        # Bootstrap: server, Scalar docs, CORS, Helmet, pipes
│
├── common/
│   └── roles.decorator.ts         # @Roles() metadata decorator
│
├── config/
│   ├── database.config.ts         # Per-environment TypeORM config factory
│   └── database.module.ts         # DatabaseModule (injects config into TypeORM)
│
├── controllers/
│   ├── user.controller.ts         # POST /user/signup|signin|new-account-request
│   ├── currencies.controller.ts   # POST /currencies
│   └── account.controller.ts      # POST /accounts, POST /accounts/:accountId/bill
│
├── dto/
│   ├── signup.dto.ts
│   ├── signin.dto.ts
│   ├── new-account-request.dto.ts
│   ├── add-new-currency.dto.ts
│   ├── create-new-account.dto.ts
│   └── calculate-account-bill.dto.ts
│
├── entities/
│   ├── user.entity.ts             # Users table
│   ├── currency.entity.ts         # Supported currencies table
│   ├── account-requests.entity.ts # Pending/approved account requests
│   └── account.entity.ts          # Active client accounts
│
├── guards/
│   ├── auth.guard.ts              # JWT verification
│   └── roles.guard.ts             # Role-based access (admin | customer)
│
├── middlewares/
│   └── user-auth.middleware.ts    # Token parsing + user attachment to request
│
├── services/
│   ├── user.service.ts            # Sign-up, sign-in, account request logic
│   ├── currencies.service.ts      # Currency CRUD
│   └── account.service.ts         # Account creation + bill calculation
│
├── tests/
│   ├── account.utils.spec.ts      # Unit tests: validateAccountId, parseAccountId, calculateCustomBaseFee
│   ├── account.controller.spec.ts # Unit tests: AccountsController
│   └── currencies.controller.spec.ts # Unit tests: CurrenciesController
│
└── utils/
    ├── account.utils.ts           # validateAccountId, parseAccountId, calculateCustomBaseFee
    └── day-js.utils.ts            # Shared dayjs instance with UTC plugin
```

---

## Core Functionality

### User roles

| Role | Who | Access |
|---|---|---|
| `customer` | Any registered user | Can request new currency accounts |
| `admin` | Users with an approved email domain (`SUPPORTED_DOMAINS`) | Can add currencies, create accounts, calculate bills |

### Authentication flow

1. A user signs up via `POST /user/signup`.
2. They sign in via `POST /user/signin` — the response contains a JWT bearer token.
3. All protected endpoints require the token in the `Authorization: Bearer <token>` header.

### Account request flow

1. A **customer** requests a new currency account via `POST /user/new-account-request`.
2. An **admin** creates the account via `POST /accounts` once the request is approved.
3. The account request status is updated to `approved` automatically on account creation.

### Billing calculation

An admin calls `POST /accounts/:accountId/bill` with a date range and transaction count. The service:

1. Looks up the account and its linked currency's monthly fee.
2. Calculates the base fee pro-rated across the exact days in the billing period.
3. Applies a percentage discount to days that fall within the discount window (see [Billing Logic](#billing-logic)).
4. Charges a per-transaction fee (`FIXED_TRANSACTION_FEE`) for every transaction above the account's `transactionThreshold`.
5. Returns a fully itemized breakdown.

---

## API Endpoints

### User

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/user/signup` | None | — | Register a new user |
| POST | `/user/signin` | None | — | Sign in and receive a JWT |
| POST | `/user/new-account-request` | Bearer | customer | Submit a new currency account request |

**POST /user/signup**
```json
{
  "name": "John",
  "surname": "Doe",
  "email": "john.doe@example.com",
  "password": "Password123!"
}
```
Password rules: min 7 characters, at least one uppercase letter, one lowercase letter, one special character.

**POST /user/signin**
```json
{
  "email": "john.doe@example.com",
  "password": "Password123!"
}
```

**POST /user/new-account-request**
```json
{
  "currency": "USD"
}
```

---

### Currencies

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/currencies` | Bearer | admin | Register a new supported currency |

**POST /currencies**
```json
{
  "currency": "USD",
  "monthlyFeeGbp": 1790
}
```
`currency` must be a valid ISO 4217 code recognized by the `currency-symbol-map` package.

---

### Accounts

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/accounts` | Bearer | admin | Create an account from an approved request |
| POST | `/accounts/:accountId/bill` | Bearer | admin | Calculate a billing statement |

**POST /accounts**
```json
{
  "accountId": "NOVO-DEN-3-1",
  "currency": "USD",
  "transactionThreshold": 100,
  "discountedDays": 7,
  "discountedRate": 10
}
```

**POST /accounts/:accountId/bill**
```json
{
  "billingPeriodStart": "2026-06-01",
  "billingPeriodEnd": "2026-06-30",
  "transactionCount": 120
}
```

Response:
```json
{
  "accountId": "NOVO-DEN-3-1",
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

---

## Account ID Format

Account IDs follow the pattern: `{businessShortName}-{country}-{userId}-{requestId}`

| Segment | Type | Description |
|---|---|---|
| `businessShortName` | string | Short identifier for the business (e.g., `NOVO`) |
| `country` | string | Country code (e.g., `DEN`) |
| `userId` | integer > 0 | Database ID of the account owner |
| `requestId` | integer > 0 | Database ID of the account request |

Example: `NOVO-DEN-3-1`

---

## Billing Logic

### Base fee

The monthly base fee for a currency is divided by the number of days in the billing month to produce a daily rate. Billing iterates day-by-day across the period, using the correct month length for each day (handles month boundaries correctly).

### Discount window

- Starts **the day after account creation** — the creation day itself is never counted.
- Spans `discountedDays` consecutive days from that point.
- The `discountedRate` percentage is applied only to days that fall within this window.

Example: account created `2026-06-07`, `discountedDays = 7`, `discountedRate = 10`

```
Creation day (excluded): 2026-06-07
Discount window:         2026-06-08 → 2026-06-14 (inclusive)

Billing 2026-07-01 → 2026-07-10: no discount applies (window already closed)
Billing 2026-06-08 → 2026-06-17: 7 days discounted, 3 days at full rate
```

### Transaction fee

If `transactionCount > transactionThreshold`, the excess is multiplied by `FIXED_TRANSACTION_FEE`:

```
transactionFeeGbp = (transactionCount - transactionThreshold) * FIXED_TRANSACTION_FEE
```

---

## Running the Application

```bash
# Development (file-based SQLite, hot-reload)
npm run start:dev

# Debug mode
npm run start:debug

# Production build then run
npm run build
npm run start:prod
```

The server starts on `PORT` (default `3000`). All API routes are available under `http://localhost:3000`.

---

## Docker

The included `Dockerfile` runs the API in **development mode** (hot-reload enabled) on port `3001` by default.

**Build the image**

```bash
docker build -t billing-api .
```

**Run the container**

Pass your `.env` file at runtime so credentials are never baked into the image:

```bash
docker run -p 3001:3001 --env-file .env billing-api
```

The API is then available at `http://localhost:3001` and the Scalar docs at `http://localhost:3001/docs`.

**Run with hot-reload (bind-mount source)**

Mount `src/` so the container picks up local file changes without a rebuild:

```bash
# macOS / Linux
docker run -p 3001:3001 --env-file .env -v $(pwd)/src:/app/src billing-api

# Windows PowerShell
docker run -p 3001:3001 --env-file .env -v ${PWD}/src:/app/src billing-api
```

> `CHOKIDAR_USEPOLLING=true` is set in the Dockerfile so file-watch events propagate correctly through the volume mount on all platforms.

**Override the port**

```bash
docker run -p 4000:4000 --env-file .env -e PORT=4000 billing-api
```

**Deploy the container**

For a production image, build from the same Dockerfile but pass production environment variables pointing at your PostgreSQL instance:

```bash
docker build -t billing-api:prod .

docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DB_URI=postgresql://user:pass@host:5432/billing_db \
  -e DB_PASSWORD=your_secure_password \
  -e JWT_SECRET=your_long_random_secret \
  -e SUPPORTED_DOMAINS=bcbgroup.io,bcbgroup.com \
  -e FIXED_TRANSACTION_FEE=0.50 \
  billing-api:prod
```

> In production mode TypeORM has `synchronize: false`. Ensure your database schema is migrated before starting the container.

---

## API Documentation

Interactive API docs are served via **Scalar** at:

```
http://localhost:3000/docs
```

The introduction section includes a bearer token input. Paste the JWT from `POST /user/signin` there and all subsequent requests in the docs will be authenticated automatically.

---

## Tests

Tests use Jest with `ts-jest` and an in-memory SQLite database (`NODE_ENV=test`).

```bash
# Run all unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

Test files live in `src/tests/` alongside the source they cover. Jest is configured in `package.json` with a `moduleNameMapper` that resolves `src/` path aliases.

| File | What it covers |
|---|---|
| `account.utils.spec.ts` | `validateAccountId`, `parseAccountId`, `calculateCustomBaseFee` |
| `account.controller.spec.ts` | `AccountsController` — routing, validation, service delegation |
| `currencies.controller.spec.ts` | `CurrenciesController` — currency validation, service delegation |

Guards are overridden in controller tests using `overrideGuard()` so tests remain isolated from JWT infrastructure.

---

## Deployment

**Production requires PostgreSQL.** Set the following in your production environment:

```
NODE_ENV=production
DB_URI=postgresql://username:password@host:5432/billing_db
DB_PASSWORD=your_secure_password
JWT_SECRET=your_long_random_secret
SUPPORTED_DOMAINS=bcbgroup.io,bcbgroup.com
FIXED_TRANSACTION_FEE=0.50
PORT=3000
```

> `synchronize` is disabled in production. Run migrations manually before starting the server.

```bash
npm run build
npm run start:prod
```

---

## Rate Limiting

All endpoints are protected by a global throttler: **10 requests per 60 seconds** per IP. Exceeding this returns `429 Too Many Requests`.

---

## License

MIT
