# Node Starter Kit

A comprehensive TypeScript starter kit for building Express APIs with advanced features. It ships with a Prisma-backed database, modular route/controller/service layers, ready-to-use CRUD endpoints, **comprehensive admin dashboard APIs**, **advanced pagination with search and sorting**, and notification systems seeded from provided mock datasets.

## Features

- **Express + TypeScript** application skeleton with production-ready middleware (`helmet`, `cors`, `compression`).
- **Environment management** powered by `dotenv` and validated with `zod`.
- **Prisma ORM** with SQLite (swap the datasource to Postgres/MySQL when ready).
- **Modular architecture** with domain packages grouped under `modules/admin`, `modules/app`, and `modules/shared`.
- **Comprehensive Admin Dashboard APIs** with statistics, charts data, and business insights.
- **Advanced Pagination System** with Laravel-style responses, search, and sorting capabilities.
- **Multi-field Search** with configurable search fields across all listing endpoints.
- **Dynamic Sorting** with field validation and direction control.
- **Seed script** that hydrates the database using the original mock JSON files.
- **Jest + Supertest** integration tests that run the Prisma migrations and seed automatically.
- **Logger utilities**, consistent JSON responses, graceful shutdown, and path-alias aware dev tooling.
- **Unified notification center** that persists records, emails users, and fans out Firebase Cloud Messaging pushes.
- **RBAC System** with roles, permissions, and assignments management.
- **Mobile App Authentication** with JWT tokens, device management, and password reset flows.

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm (bundled with Node.js)

### Installation & Database Setup

```bash
npm install
npm run prisma:migrate   # prisma migrate dev --name init
npm run db:seed          # populate the database from mocks
```

### Available Scripts

- `npm run dev` � start the development server with hot reload (`nodemon` + `ts-node` + path aliases).
- `npm run build` � compile TypeScript into the `dist` directory.
- `npm start` � run the compiled JavaScript from the `dist` folder.
- `npm test` � execute the Jest suite (runs migrations + seed before the tests).
- `npm run prisma:migrate` � run `prisma migrate dev` (create/apply local migrations).
- `npm run prisma:deploy` � run `prisma migrate deploy` (apply committed migrations).
- `npm run prisma:generate` � regenerate the Prisma client.
- `npm run db:seed` � seed the database using `prisma/seed.ts`.

## Environment Variables

Copy `.env.example` to `.env` and adjust values as needed:

```bash
cp .env.example .env
```

| Variable        | Description                                   | Default                    |
| --------------- | --------------------------------------------- | -------------------------- |
| `APP_NAME`      | Human friendly application name               | `Node Starter Kit`         |
| `NODE_ENV`      | `development`, `test`, or `production`        | `development`              |
| `PORT`          | Port the HTTP server listens on               | `3000`                     |
| `LOG_LEVEL`     | Minimum logger level (`debug` to `error`)     | `info`                     |
| `DATABASE_URL`  | Prisma datasource URL                         | `file:./prisma/dev.db`     |
| `APP_API_KEY`   | Required API key for `/api/app/auth` routes  | `local-dev-app-api-key`    |
| `APP_JWT_SECRET`| HMAC secret for app user JWT tokens           | `change-me-app-jwt-secret-change-me` |
| `APP_JWT_EXPIRES_IN` | JWT access token lifetime (e.g. `15m`, `1h`) | `15m`                      |
| `ADMIN_JWT_SECRET` | HMAC secret for admin JWT tokens              | `change-me-admin-jwt-secret-change-me` |
| `ADMIN_JWT_EXPIRES_IN` | Admin JWT lifetime (e.g. `30m`)                | `30m`                     |
| `APP_PASSWORD_RESET_TOKEN_TTL_MINUTES` | Password reset token lifetime in minutes       | `30`                       |
| `MAIL_TRANSPORT` | Mail transport driver (`smtp`, `json`, or `stub`) | `json` |
| `MAIL_FROM` | Default `from` email address                     | `no-reply@node-kit.local` |
| `SMTP_HOST` | SMTP host (required for SMTP transport)          | _(empty)_                 |
| `SMTP_PORT` | SMTP port                                        | `587`                     |
| `SMTP_SECURE` | Enables TLS for SMTP transport                  | `false`                   |
| `SMTP_USER` | SMTP username (optional)                         | _(empty)_                 |
| `SMTP_PASSWORD` | SMTP password (optional)                     | _(empty)_                 |
| `FIREBASE_PROJECT_ID` | Firebase project used for FCM push delivery | _(empty)_                 |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account client email        | _(empty)_                 |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key (`\n` escaped) | _(empty)_                 |

## Notifications & Mail

The kit includes a reusable mailer (powered by Nodemailer) and a Firebase Cloud Messaging client (via the Admin SDK). Both are orchestrated by the `notificationCenter` service so you can persist a notification record and optionally fan it out over email and push with a single call.

**Localization**
- Persist per-locale titles/messages with `default_locale` and `localized_content` when creating admin notifications.
- App users store their preferred `locale`; notification fan-out uses that locale (with fallback heuristics) and persists the whole translation map for future reads.
- App-facing notification APIs return localized copies alongside the translation catalog so clients can render in multiple languages.

- `src/core/lib/mailer.ts` sets up SMTP/JSON/stub transports driven by `MAIL_*` environment variables.
- `src/core/lib/firebase.ts` boots the Firebase Admin SDK using the `FIREBASE_*` credentials.
- `src/core/lib/pushClient.ts` sends multicast pushes through FCM and gracefully logs when credentials are absent.
- `src/core/services/notificationCenter.ts` persists notifications, respects per-user notification preferences, and coordinates channel delivery (used by the admin notification endpoints).
- `src/core/templates/email` houses Handlebars layouts/partials (header/footer) so individual templates can reuse a common chrome while injecting custom bodies.
- Email delivery supports reusable templates via the `master` layout (common header/footer) and can be extended by registering custom templates in `src/core/templates/email`.

To send a notification from any module:

```ts
import { notificationCenter } from "@/core/services/notificationCenter";

await notificationCenter.notifyUser(42, {
  title: "Order shipped",
  message: "Your order #ORD-1001 is on the way.",
  email: {
    subject: "We just shipped your order",
    html: "<p>Track it in the app.</p>",
  },
  push: {
    to: "user-device-token",
    data: { orderId: "ORD-1001" },
  },
});
```

Admin notification routes now return delivery metadata (`email` and `push`) alongside the persisted record so you can inspect channel outcomes at a glance.

## Project Structure

```
src/
  core/                System-level utilities shared across the app
    config/            Environment parsing + application configuration
    lib/               Shared libraries (Prisma client, mailer, push client, etc.)
    services/          Cross-cutting orchestration (notification center)
    middlewares/       Global middleware (auth, error handler, logger)
    utils/             Cross-cutting helpers (logger, responses, security, **pagination**)
  modules/             Domain-focused feature modules
    admin/             Admin panel features
      dashboard/       **Admin Dashboard APIs** with statistics and pagination
        dashboard.service.ts    Business logic for dashboard data
        dashboard.controller.ts HTTP request handlers
        dashboard.router.ts     Route definitions
        dashboard.validation.ts Input validation schemas
        README.md              Dashboard API documentation
        RESPONSE_EXAMPLE.md    Response format examples
      users/           Admin user management
      menuLinks/       Admin navigation links
      settings/        Shared settings bundles
        appSettings/   Application release settings
        languages/     Supported locales management
      index.ts         Barrel exports for admin routers
    app/               Customer-facing app modules
      auth/            Mobile authentication flows
      customers/       Customer directory APIs
      orders/          Order management APIs
      products/        Product catalogue APIs
      faqs/            FAQ content APIs
      contactRequests/ Contact & inquiry handling
      index.ts         Barrel exports for app routers
    shared/            Modules shared by admin + app
      rbac/            Role-based access control endpoints
      index.ts         Barrel exports for shared routers
  routes/              API routers composed per domain
    admin.routes.ts    Mounts admin module routers
    app.routes.ts      Mounts app module routers
    shared.routes.ts   Shared routes (health, examples, RBAC)
    example.routes.ts  Demo routes
    health.routes.ts   Health check route
    index.ts           Central API router
  server.ts            Express app factory and HTTP server entry point
  index.ts             Application bootstrapper (wires Prisma shutdown + server lifecycle)
prisma/
  schema.prisma        Prisma data model (SQLite by default)
  migrations/          Migration history (generated by Prisma)
  seed.ts              Seeder that hydrates the DB from ./mocks
mocks/                 Original JSON fixtures (source of truth for seeding)
postman/               **Postman API Collection**
  Node-Starter-Kit.postman_collection.json  Complete API collection with examples
  dashboard-requests.json                   Dashboard-specific API requests
tests/
  jest.setup.ts        Applies migrations + seed before tests run
  app.test.ts          Integration tests covering key modules
```

## API Modules

### Core API Endpoints

All feature modules expose full CRUD endpoints backed by Prisma with advanced pagination, search, and sorting:

| Endpoint                      | Description                                  | Pagination |
| ----------------------------- | -------------------------------------------- | ---------- |
| `/api/admin/dashboard`        | **Admin Dashboard APIs** with statistics and insights | ✅ |
| `/api/admin/users`            | Manage administrative users                  | ✅ |
| `/api/admin/customers`        | Customer directory with advanced filtering   | ✅ |
| `/api/admin/orders`           | Order ledger (auto-generates `ORD-###` IDs)  | ✅ |
| `/api/admin/products`         | Product catalogue with variants/tags metadata | ✅ |
| `/api/admin/contact-requests` | Contact form submissions with search/sort    | ✅ |
| `/api/admin/notifications`    | Notification management and delivery         | ✅ |
| `/api/admin/settings/app`     | Mobile app release + maintenance settings    | ❌ |
| `/api/admin/settings/languages` | Supported locales management               | ❌ |
| `/api/admin/menu-links`       | Legal/support content per audience           | ❌ |
| `/api/admin/faqs`             | Localized FAQ entries (question/answer JSON) | ❌ |
| `/api/app/auth`               | Mobile app authentication + profile endpoints | ❌ |
| `/api/app/products`           | Public product catalogue                     | ❌ |
| `/api/app/customers`          | Customer management for app users            | ❌ |
| `/api/app/orders`             | Order management for app users               | ❌ |
| `/api/app/contact-requests`   | Contact form submissions                     | ❌ |
| `/api/app/faqs`               | Public FAQ content                           | ❌ |
| `/api/rbac` + sub-routes      | RBAC system: modules, permissions, roles, assignments | ❌ |

### Response Format

- **Success responses**: `{ status: true, message: string, data: any }`
- **Paginated responses**: Laravel-style pagination with `data`, `links`, and `meta` objects
- **Error responses**: Normalized through `handlePrismaError` with consistent structure

## Mobile App Auth

All `/api/app/auth` endpoints require the `x-api-key` header (or `api_key` query parameter) to match `APP_API_KEY`. Authentication responses return `{ token, user }`, where `token` is a JWT signed with `APP_JWT_SECRET` and `user` contains non-sensitive profile fields. Register/login payloads accept optional `device_token` + `notifications_enabled` flags so the API can manage Firebase push targets, and `/logout` clears the token server-side. Requests may also send `locale` to capture the user�s preferred language for localized notifications.

| Method & Path                 | Description                               |
| ----------------------------- | ----------------------------------------- |
| `POST /api/app/auth/register` | Sign up a new app user and return a JWT   |
| `POST /api/app/auth/login`    | Exchange email/password for a JWT (optionally registers `device_token` & `locale`) |
| `POST /api/app/auth/forgot-password` | Issue a reset token (returned in response for dev/testing) |
| `POST /api/app/auth/reset-password`  | Reset the password using the provided token |
| `GET /api/app/auth/profile`   | Fetch the authenticated profile           |
| `PATCH /api/app/auth/profile` | Update profile fields and rotate the JWT  |
| `POST /api/app/auth/logout`   | Clear the stored device token and pause push notifications |

Reset tokens are hashed before storage and expire after `APP_PASSWORD_RESET_TOKEN_TTL_MINUTES`. Successful password resets invalidate older tokens by bumping the user's `apiTokenVersion`.

## Admin API

All admin endpoints are available under `/api/admin`. Authenticate first using `POST /api/admin/auth/login` with seeded credentials (see `.env/.env.example`). Subsequent requests must include the `Authorization: Bearer <token>` header. The login response returns `{ token, admin }`, stores any provided `device_token`, and `/logout` will wipe that token so Firebase pushes stop for that session. Changing an admin password rotates their token version to invalidate existing sessions.

Key admin routes include:

| Path | Description |
| ---- | ----------- |
| `POST /api/admin/auth/login` | Exchange admin credentials for a JWT (captures optional admin device token/preferences) |
| `POST /api/admin/auth/logout` | Clear the stored device token to halt admin pushes |
| `GET /api/admin/users` | Manage staff accounts |
| `POST /api/admin/products` | Create or update catalogue items |
| `PUT /api/admin/contact-requests/:id` | Record replies to contact requests |
| `GET /api/admin/settings/app` | Inspect mobile release settings |

## Admin Dashboard APIs

The admin dashboard provides comprehensive business intelligence and management capabilities through a suite of powerful APIs:

### Dashboard Overview
- **`GET /api/admin/dashboard/overview`** - Complete dashboard data in a single request
- **`GET /api/admin/dashboard/stats`** - Basic statistics (customers, orders, revenue)

### Chart Data APIs
- **`GET /api/admin/dashboard/orders/status-counts`** - Order status distribution for pie charts
- **`GET /api/admin/dashboard/revenue/monthly`** - Monthly revenue trends for line charts  
- **`GET /api/admin/dashboard/products/category-stats`** - Product category breakdown for bar charts

### Paginated Listings (with Search & Sort)
All listing endpoints support advanced pagination with Laravel-style responses:

- **`GET /api/admin/dashboard/customers`** - Paginated customers with search/sort
- **`GET /api/admin/dashboard/orders`** - Paginated orders with search/sort
- **`GET /api/admin/dashboard/products`** - Paginated products with search/sort
- **`GET /api/admin/dashboard/contact-requests`** - Paginated contact requests with search/sort
- **`GET /api/admin/dashboard/activities/recent`** - Paginated recent activities feed

### Business Intelligence
- **`GET /api/admin/dashboard/customers/top`** - Top customers by order count
- **`GET /api/admin/dashboard/products/low-inventory`** - Low stock alerts

### Query Parameters for Pagination

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `per_page` | number | 10 | Items per page (max: 100) |
| `sortBy` | string | - | Field to sort by |
| `sortOrder` | string | - | Sort direction (`asc` or `desc`) |
| `search` | string | - | Search query |
| `searchFields` | string | - | Comma-separated fields to search |

### Laravel-Style Pagination Response

```json
{
  "status": true,
  "message": "Data fetched successfully",
  "data": [...],
  "links": {
    "first": "https://domain.com/api/admin/dashboard/customers?page=1&per_page=20",
    "last": "https://domain.com/api/admin/dashboard/customers?page=5&per_page=20",
    "prev": "https://domain.com/api/admin/dashboard/customers?page=1&per_page=20",
    "next": "https://domain.com/api/admin/dashboard/customers?page=3&per_page=20"
  },
  "meta": {
    "current_page": 2,
    "from": 21,
    "last_page": 5,
    "links": [...],
    "path": "https://domain.com/api/admin/dashboard/customers",
    "per_page": 20,
    "to": 40,
    "total": 95
  }
}
```

## Advanced Pagination System

The starter kit includes a comprehensive pagination system inspired by Laravel's pagination with advanced features:

### Features
- **Laravel-style Response Format** - Complete pagination metadata with navigation links
- **Multi-field Search** - Search across multiple database fields with configurable search targets
- **Dynamic Sorting** - Sort by any allowed field with validation
- **Smart URL Generation** - Preserves all query parameters in navigation links
- **Performance Optimized** - Parallel queries for data and count with efficient database queries

### Pagination Utilities

The system includes reusable pagination utilities in `src/core/utils/pagination.ts`:

- **`parseListQueryParams()`** - Parse pagination, sort, and search parameters
- **`createPaginatedResponse()`** - Generate Laravel-style paginated responses
- **`calculatePaginationMeta()`** - Calculate complete pagination metadata
- **Type-safe interfaces** - Full TypeScript support with proper type definitions

### Usage Example

```typescript
// In your controller
const { pagination, sort, search } = parseListQueryParams(
  req,
  ["createdAt", "name", "email"], // allowed sort fields
  ["name", "email", "company"]    // default search fields
);

const result = await service.listPaginated({
  pagination,
  sort,
  search,
  filters: { status: "active" }
});

res.json({
  status: true,
  message: "Data fetched successfully",
  ...result
});
```

### Frontend Integration

The pagination system is designed for easy frontend integration:

```javascript
// Fetch paginated data
const response = await fetch('/api/admin/dashboard/customers?page=2&per_page=20&sortBy=name&sortOrder=asc&search=company');
const data = await response.json();

// Use pagination metadata
const { data: customers, links, meta } = data;
const { current_page, last_page, total, per_page } = meta;

// Build pagination UI using links.first, links.prev, links.next, links.last
// and meta.links array for page numbers
```

App-facing endpoints are namespaced under `/api/app` and are read-only for catalogue/FAQ resources.

## Postman API Collection

The starter kit includes a comprehensive Postman collection for testing and development:

### Collection Files
- **`postman/Node-Starter-Kit.postman_collection.json`** - Complete API collection with all endpoints
- **`postman/dashboard-requests.json`** - Dashboard-specific API requests with pagination examples

### Collection Features
- **Complete API Coverage** - All admin and app endpoints with examples
- **Authentication Examples** - Admin and app authentication flows
- **Pagination Examples** - All paginated endpoints with query parameters
- **Dashboard APIs** - Complete dashboard endpoint collection
- **Environment Variables** - Pre-configured variables for easy testing
- **Request Examples** - Realistic payload examples for all endpoints

### Environment Variables
The collection includes pre-configured environment variables:
- `baseUrl` - API base URL (default: http://localhost:3000)
- `apiKey` - App API key for authentication
- `adminEmail` / `adminPassword` - Admin credentials
- `adminToken` / `appAuthToken` - JWT tokens for authenticated requests

### Usage
1. Import the collection into Postman
2. Set up environment variables
3. Run the authentication requests to get tokens
4. Test all endpoints with proper authentication headers



## Testing

The integration suite (`npm test`) will:

1. Apply committed migrations (`npx prisma migrate deploy`).
2. Seed the database (`npm run db:seed`).
3. Exercise the live Express app with Supertest (CRUD flows across admins, products, RBAC, etc.).

If you add new modules, export their routers from `src/modules/<module>/<module>.router.ts`, register them in `src/routes/index.ts`, add service/controller tests, and extend the seeder with the corresponding mock data.

## Deployment

For production builds:

```bash
npm run build
npm start
```

Swap the Prisma datasource to your production database, run `npm run prisma:deploy` during release, and execute the seed (or your own seed script) as needed.

## Quick Start with New Features

### Dashboard APIs
1. **Start the server**: `npm run dev`
2. **Import Postman collection**: Use `postman/Node-Starter-Kit.postman_collection.json`
3. **Authenticate**: Use admin login to get JWT token
4. **Test Dashboard APIs**:
   - Get dashboard overview: `GET /api/admin/dashboard/overview`
   - Get paginated customers: `GET /api/admin/dashboard/customers?page=1&per_page=10`
   - Search and sort: `GET /api/admin/dashboard/orders?page=1&sortBy=total&sortOrder=desc&search=pending`

### Advanced Pagination
- All listing endpoints now support Laravel-style pagination
- Use query parameters: `page`, `per_page`, `sortBy`, `sortOrder`, `search`
- Response includes complete navigation metadata and links

### Business Intelligence
- Dashboard provides comprehensive business insights
- Chart data for visualizations (revenue, orders, products)
- Top customers and low inventory alerts
- Recent activities feed with pagination
