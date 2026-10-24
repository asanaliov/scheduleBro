# Schedule-Bro

Schedule-Bro is a small scheduling app for publishing appointment availability and booking an open time.

Your time. Your slots. Sorted.

## Features

- Hosts can publish future slots, view booking details, filter by status, and remove unbooked slots.
- Visitors can browse and book an available slot with their name and email.
- A slot becomes unavailable as soon as its booking succeeds.
- The server rejects invalid input, past times, overlapping slots, and duplicate bookings.
- All dates and times use the Europe/Skopje timezone.
- The host dashboard has no authentication and is suitable only as a private MVP.

## Screenshots

- Public booking page: _Screenshot placeholder. Add a real screenshot when one is available._
- Host dashboard: _Screenshot placeholder. Add a real screenshot when one is available._

## Technology

- Next.js 16 with the App Router and Route Handlers.
- React 19 and TypeScript.
- SQLite through the `better-sqlite3` Node driver.
- Zod for API request validation.
- Node's built-in test runner for API and business-rule tests.
- Plain CSS for the interface.

## Architecture

The pages render their initial slot lists on the server and pass the small public or host view into interactive React components.

The browser uses Route Handlers for listing, creating, deleting, and booking slots.

Database queries and scheduling rules live in `lib/server`.

The database stores UTC timestamps as integer milliseconds, while the application converts form dates from Europe/Skopje and formats all displayed times in that timezone.

The timezone conversion rejects invalid dates and times that are skipped or repeated during daylight-saving changes.

Each booking has a unique `slot_id` and a foreign key to its slot, so SQLite cannot store two bookings for one slot or delete a booked slot.

Booking runs its availability check and insert inside an immediate SQLite transaction, then returns HTTP 409 if the slot is already booked.

An SQLite trigger and a transaction prevent overlapping availability slots.

Public API responses include only slot details and do not include visitor names or email addresses.

The host API returns visitor details because the dashboard displays them.

The host dashboard has no login, so anyone who can reach it can change availability and view visitor details.

Do not expose this MVP as a secure public host dashboard.

## Local setup

Use Node.js 20.12 or later.

Install dependencies:

```bash
npm ci
```

Create a local environment file:

```bash
cp .env.example .env
```

Create the database tables:

```bash
npm run db:migrate
```

Start the application:

```bash
npm run dev
```

The development command also checks and applies migrations before starting Next.js.

Open [http://localhost:3000](http://localhost:3000) for the visitor page.

Open [http://localhost:3000/host](http://localhost:3000/host) for the host dashboard.

To add sample availability to an empty database, run:

```bash
npm run db:seed
```

The seed command does nothing when the database already contains slots and never creates visitor records.

## Database configuration

`DATABASE_PATH` is the only required environment variable.

It defaults to `./data/schedule-bro.sqlite` relative to the project directory.

The database directory is created automatically and local database files are ignored by Git.

Migrations are the SQL files in `db/migrations` and are tracked with a local migration table.

Apply pending migrations with `npm run db:migrate`.

To reset local data, stop the development server and run:

```bash
npm run db:reset
```

Reset removes all slots and bookings in the configured database, then recreates an empty schema.

## API endpoints

- `GET /api/slots` lists upcoming slots that do not have a booking.
- `GET /api/host/slots` lists upcoming slots with their status and visitor details.
- `POST /api/host/slots` creates a slot from a date, start time, and duration in minutes.
- `DELETE /api/host/slots/:id` deletes an unbooked slot.
- `POST /api/bookings` books a slot using a slot ID, visitor name, and visitor email.

Successful creates return HTTP 201.

Invalid request bodies return HTTP 400.

Missing slots return HTTP 404.

Unavailable or overlapping slots and attempts to delete a booked slot return HTTP 409.

Unexpected database failures return a generic HTTP 500 response, and temporary SQLite locks return HTTP 503.

API errors use the shape `{ "error": { "code": "...", "message": "..." } }`.

## Checks

Run the database-backed API tests:

```bash
npm test
```

Run lint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

The API tests cover slot creation, invalid input, overlap rejection, booking, duplicate and concurrent booking attempts, deletion rules, timezone edge cases, and public data privacy.

## Deployment and storage

This repository uses a local SQLite file through `better-sqlite3`.

For deployment, use a Node.js server with a durable disk and set `DATABASE_PATH` to a file on that disk.

Run `npm run db:migrate` as part of the release process before starting the new application version.

A local SQLite file on a serverless platform such as Vercel is not a reliable shared or persistent database across instances and deployments.

This repository does not configure a remote database, so it is not ready for a multi-instance serverless deployment.

To use serverless hosting, replace the local driver with a shared database and update the database layer and deployment configuration.

## AI tools

Codex assisted with implementation planning, code drafting, and running the requested checks.

The code and test results should be reviewed like any other contribution.

## Known limitations and next steps

- The host page and host APIs have no authentication or authorization.
- The application does not send email confirmations or reminders.
- There is no rate limiting, email verification, or spam protection.
- The current database driver uses a local SQLite file and needs durable shared storage for deployment.
- The application supports one host and does not include accounts or calendar integrations.

Possible future work includes authentication, email notifications, rate limiting, and a remote shared database.
