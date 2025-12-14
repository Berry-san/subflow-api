# Sublow Backend

A production-grade backend for a subscription and group payments platform, built with NestJS, PostgreSQL, and Prisma.

## Features

- **Authentication**: 
  - JWT-based Auth with Refresh Tokens
  - Local Strategy (Email/Password)
  - OAuth (Google & Apple)
  - Role-Based Access Control (RBAC) covering `SYSTEM_OWNER`, `ADMIN`, and `MEMBER` roles.
- **User Management**: Profile management and secure password handling with Argon2.
- **Subscriptions**: Admin-managed subscription plans.
- **Groups**: 
  - Group creation and management.
  - Membership flows (Join, Approve, Decline).
- **Payments**: 
  - "No-custody" payment model using split payments.
  - Payment link generation.
  - Webhook handling for payment providers (e.g., Paystack).
  - Payout settings management.
- **Background Jobs**: BullMQ and Redis for scheduling email reminders.
- **System Owner**: Global dashboard for system statistics.

## Prerequisites

- Node.js (v18 or later)
- Docker & Docker Compose (for PostgreSQL and Redis)

## Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd sublow-nestjs
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Copy `.env.example` to `.env` and update the values:
    ```bash
    cp .env.example .env
    ```
    - Update `DATABASE_URL` if not using the default Docker setup.
    - Set `JWT_SECRET` and `JWT_REFRESH_SECRET`.
    - Configure OAuth keys (`GOOGLE_CLIENT_ID`, `APPLE_CLIENT_ID`, etc.) if using Social Login.

4.  **Start Database & Redis**:
    ```bash
    docker-compose up -d
    ```

5.  **Run Database Migrations**:
    ```bash
    npx prisma migrate dev
    ```

6.  **Seed the Database**:
    Creates the initial `SYSTEM_OWNER` account.
    ```bash
    npx ts-node prisma/seed.ts
    ```

## Running the Application

**Development**:
```bash
npm run start:dev
```

**Production**:
```bash
npm run build
npm run start:prod
```

The server runs on `http://localhost:3000` by default.

## API Documentation

The API Documentation is generated using Swagger.

- Access Swagger UI: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

## Testing

**Unit Tests**:
```bash
npm run test
```

**E2E Tests**:
```bash
npm run test:e2e
```

## License

[UNLICENSED](LICENSE)
