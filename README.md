# Schedule-Bro

Schedule-Bro is a small appointment-booking app for a single barber in Skopje.

Customers choose a service, select an opening, and book with their name and email.

The barber publishes booking windows and sees customer and service details in a simple dashboard.

## Features

- Fixed services: Haircut (30 minutes, MKD 900), Beard trim (20 minutes, MKD 500), and Haircut + beard (45 minutes, MKD 1,250).
- Available times are filtered to windows long enough for the selected service.
- Booking details and the service price and duration are stored in SQLite.
- Database constraints prevent a booking window from being booked twice or overlapping another window.
- All dates and times use Europe/Skopje.
- The host dashboard has no authentication and is suitable only for a private MVP.

## Screenshots

- Customer booking page: _Screenshot placeholder. Add a real screenshot when one is available._
- Barber desk: _Screenshot placeholder. Add a real screenshot when one is available._

## Technology

- Next.js 16 App Router and Route Handlers.
- React 19 and TypeScript.
- SQLite through the `better-sqlite3` Node driver.
- Zod for request validation.
- Node's built-in test runner.
- Plain CSS for the responsive interface.

## How booking windows work

The barber creates non-overlapping windows with a start time and length.

A service can be booked only when its duration fits inside the chosen window.

Each window is reserved in full after booking, even when the chosen service is shorter.

This intentionally leaves some unused time in exchange for keeping the schedule simple and making one-booking-per-window enforcement reliable.

SQLite enforces a unique booking per window and a trigger prevents overlapping windows.

The booking transaction checks the window, service duration, and booking write together.

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

Start the app:

```bash
npm run dev
```

The development command applies pending database migrations before Next.js starts.

Open [http://localhost:3000](http://localhost:3000) to book an appointment.

Open [http://localhost:3000/host](http://localhost:3000/host) to manage booking windows.

To add three example 60-minute windows to an empty database, run:

```bash
npm run db:seed
```

The seed command does nothing if the database already contains windows.

## Database

`DATABASE_PATH` optionally sets the SQLite file location and defaults to `./data/schedule-bro.sqlite`.

The database directory is created automatically, and local database files are ignored by Git.

Migration files are stored in `db/migrations` and tracked in the database.

To remove all local bookings and windows and recreate the schema, stop the app and run:

```bash
npm run db:reset
```

## API

- `GET /api/slots?serviceId=haircut` lists upcoming windows that fit the selected service.
- `GET /api/host/slots` lists upcoming windows with booking and service details.
- `POST /api/host/slots` creates a booking window.
- `DELETE /api/host/slots/:id` deletes an unbooked window.
- `POST /api/bookings` books a window with a service, name, and email.

Invalid input returns HTTP 400, a missing window returns HTTP 404, and unavailable or overlapping windows return HTTP 409.

Database errors return a generic message without exposing internal details.

## Checks

Run the database-backed API and business-rule tests:

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

Tests cover slot creation, invalid input, service duration checks, overlapping windows, duplicate and concurrent booking attempts, deletion rules, timezone edge cases, and public data privacy.

## Deployment and limitations

This app uses a local SQLite file through `better-sqlite3`.

Deploy it to a Node.js server with a durable disk and set `DATABASE_PATH` to a file on that disk.

Run `npm run db:migrate` during release before starting the new app version.

A local SQLite file on a serverless platform such as Vercel is not reliable shared storage across instances or deployments.

The host dashboard has no login or authorization, so anyone who can reach it can change windows and view customer details.

Do not expose the dashboard as a secure public admin interface.

There is no email confirmation, payment flow, customer account, or multiple-barber support.

## AI coding tools

OpenAI Codex assisted with implementation planning, code changes, and running checks.

The application does not include an LLM feature.

## What I would improve with more time

- Add authentication before exposing the barber dashboard publicly.
- Add email confirmations and cancellation handling.
- Add a shared database before using a serverless deployment.
- Add real screenshots after capturing the finished app.
