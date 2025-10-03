# Node Starter Kit

A lean TypeScript starter kit for building Express APIs. It now ships with a Prisma-backed SQLite database, modular route/controller/service layers, and ready-to-use CRUD endpoints seeded from the provided mock datasets.

## Features

- Express + TypeScript application skeleton with production-ready middleware (`helmet`, `cors`, `compression`).
- Environment management powered by `dotenv` and validated with `zod`.
- Prisma ORM with SQLite (swap the datasource to Postgres/MySQL when ready).
- Modular domain packages grouped under `modules/admin`, `modules/app`, and `modules/shared`, each exposing controllers, services, validations, and routers.
- Seed script that hydrates the database using the original mock JSON files.
- Jest + Supertest integration tests that run the Prisma migrations and seed automatically.
- Logger utilities, consistent JSON responses, graceful shutdown, and path-alias aware dev tooling (`ts-node` + `tsconfig-paths`).
- Unified notification center that persists records, emails users, and fans out Firebase Cloud Messaging pushes.

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

- `npm run dev` – start the development server with hot reload (`nodemon` + `ts-node` + path aliases).
- `npm run build` – compile TypeScript into the `dist` directory.
- `npm start` – run the compiled JavaScript from the `dist` folder.
- `npm test` – execute the Jest suite (runs migrations + seed before the tests).
- `npm run prisma:migrate` – run `prisma migrate dev` (create/apply local migrations).
- `npm run prisma:deploy` – run `prisma migrate deploy` (apply committed migrations).
- `npm run prisma:generate` – regenerate the Prisma client.
- `npm run db:seed` – seed the database using `prisma/seed.ts`.

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
    utils/             Cross-cutting helpers (logger, responses, security)
  modules/             Domain-focused feature modules
    admin/             Admin panel features
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
tests/
  jest.setup.ts        Applies migrations + seed before tests run
  app.test.ts          Integration tests covering key modules
```

## API Modules

All feature modules expose full CRUD endpoints backed by Prisma. Examples (prefixed with `/api`):

| Endpoint                      | Description                                  |
| ----------------------------- | -------------------------------------------- |
| `/admins`                     | Manage administrative users                  |
| `/customers`                  | Customer directory with status/country filters |
| `/orders`                     | Order ledger (auto-generates `ORD-###` IDs)  |
| `/products`                   | Product catalogue with variants/tags metadata |
| `/app-settings`               | Mobile app release + maintenance settings    |
| `/app-menu-links`             | Legal/support content per audience           |
| `/app/auth`                   | Mobile app authentication + profile endpoints |
| `/contact-requests`           | Contact form submissions (filterable by date) |
| `/faqs`                       | Localised FAQ entries (question/answer JSON) |
| `/languages`                  | Supported locales                            |
| `/rbac` + sub-routes          | Modules, permissions, roles, assignments snapshot + management |

Each controller returns the shared `{ success, message, data }` payload, and errors are normalised through `handlePrismaError`.

## Mobile App Auth

All `/api/app/auth` endpoints require the `x-api-key` header (or `api_key` query parameter) to match `APP_API_KEY`. Authentication responses return `{ token, user }`, where `token` is a JWT signed with `APP_JWT_SECRET` and `user` contains non-sensitive profile fields. Register/login payloads accept optional `device_token` + `notifications_enabled` flags so the API can manage Firebase push targets, and `/logout` clears the token server-side. Requests may also send `locale` to capture the user’s preferred language for localized notifications.

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

App-facing endpoints are namespaced under `/api/app` and are read-only for catalogue/FAQ resources.



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
