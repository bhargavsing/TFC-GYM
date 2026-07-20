# GymFlow

TFC Gym & Turf Management System is a plain JavaScript/JSX MERN monorepo for
running a gym, turf bookings, public website content, customer dashboards,
partner revenue sharing, feedback, and admin operations.

It now includes:

- Node.js, Express, Mongoose, and MongoDB member management APIs
- MongoDB Atlas-ready configuration
- JWT authentication with access tokens, refresh tokens, HTTP-only refresh cookies, bcrypt password hashing, and role guards
- Security middleware: Helmet, CORS credentials, rate limiting, request sanitization, centralized error handling
- Domain models for users, sessions, gym members, plans, memberships, attendance, turf, bookings, slot locks, payments, refunds, partners, settlements, feedback, notifications, coupons, website content, audit logs, and expenses
- React, Vite, Tailwind CSS, React Router, Axios, TanStack Query, Zustand, React Hook Form, Zod, and Recharts
- Member registration, editing, renewals, payment tracking, plan tracking, and deletion
- Admin dashboard metrics, charts, and quick actions
- Public pages for Home, Plans, Turf, and Feedback
- Customer and partner dashboard shells connected to real APIs
- Seed script with demo super admin, customer, partner, plans, turf, booking, payment, feedback, website content, and settlement data
- A local MongoDB service with Docker Compose

The app is intentionally modular so the remaining deep workflow screens can be
expanded without replacing the architecture.

## Repository layout

```text
.
|-- backend/                 Node.js/Express REST API
|   |-- src/
|   |   |-- auth/            JWT auth, refresh sessions, role guards
|   |   |-- common/          Shared HTTP errors and error handling
|   |   |-- config/          Environment and MongoDB connection
|   |   |-- jobs/            Scheduled membership status updates
|   |   |-- member/          Model, validation, service, controller, routes
|   |   |-- models/          TFC domain Mongoose schemas
|   |   |-- routes/          TFC REST API routes
|   |   |-- seeds/           Demo data seed script
|   |   |-- services/        Audit and ID generation helpers
|   |   `-- subscription/    Subscription model
|   `-- test/                Backend API tests
|-- frontend/                React/Vite application
|   `-- src/
|       |-- api/             HTTP client functions
|       |-- store/           Zustand auth store
|       |-- App.jsx          Routed TFC public/admin/customer/partner UI
|-- docs/                    Architecture and delivery roadmap
`-- compose.yaml             Local MongoDB
```

## Prerequisites

- Node.js 22.12+
- Docker (optional, for local MongoDB)

## Run locally

Start MongoDB:

```bash
docker compose up -d
```

Start the API:

```bash
cd backend
npm install
npm run seed
npm run seed:admin
npm run dev
```

Start the web app in another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite development server proxies `/api`
requests to the backend at `http://localhost:8080`.

## Demo credentials

Development credentials are created by `npm run seed`.

```text
Admin: admin / value of ADMIN_SEED_PASSWORD
Super Admin legacy user: superadmin@tfc.local / TFCAdmin123
```

## API highlights

```http
GET  /api/health
POST /api/auth/register
POST /api/auth/login
POST /api/auth/admin/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/logout-all
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me

POST /api/admin/login
POST /api/admin/logout
GET  /api/admin/me

GET  /api/public/home
GET  /api/membership-plans
POST /api/admin/membership-plans
PATCH /api/admin/membership-plans/:planId
DELETE /api/admin/membership-plans/:planId

GET  /api/v1/members/dashboard
GET  /api/v1/members
POST /api/v1/members
PATCH /api/v1/members/:memberId
DELETE /api/v1/members/:memberId

GET  /api/admin/dashboard
GET  /api/admin/members
POST /api/admin/members
GET  /api/admin/members/:memberId
PATCH /api/admin/members/:memberId
PATCH /api/admin/members/:memberId/status
POST /api/admin/members/:memberId/renew
GET  /api/admin/members/:memberId/payments
GET  /api/admin/members/:memberId/attendance

GET  /api/admin/attendance
POST /api/admin/attendance/check-in
POST /api/admin/attendance/:attendanceId/check-out

GET  /api/turfs
POST /api/admin/turfs
GET  /api/turfs/:turfId/availability
GET  /api/turf-slots?date=YYYY-MM-DD
POST /api/admin/turf-slots/generate-day
POST /api/admin/turf-slots/upsert
PUT  /api/admin/turf-slots/:id
POST /api/turf-bookings/lock
POST /api/turf-bookings
GET  /api/turf-bookings/my
PATCH /api/turf-bookings/:bookingId/cancel

POST /api/payments/create-order
POST /api/payments/verify
POST /api/payments/webhook
GET  /api/payments/my
GET  /api/admin/payments
POST /api/admin/payments/manual

POST /api/feedback
GET  /api/feedback/my
GET  /api/admin/feedback
PATCH /api/admin/feedback/:feedbackId

GET  /api/admin/partners
POST /api/admin/partners
PATCH /api/admin/partners/:partnerId
GET  /api/partner/dashboard
GET  /api/partner/ledger
GET  /api/partner/settlements

POST /api/admin/settlements/generate
GET  /api/admin/settlements
PATCH /api/admin/settlements/:settlementId/approve
PATCH /api/admin/settlements/:settlementId/mark-paid

GET  /api/notifications
PATCH /api/notifications/:notificationId/read
PATCH /api/notifications/read-all

GET  /api/admin/website-content/:key
PUT  /api/admin/website-content/:key
```

Example request:

```bash
curl -X POST http://localhost:8080/api/v1/members \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Asha","lastName":"Rao","email":"asha@example.com","phone":"+919876543210","plan":"PREMIUM","paymentStatus":"PAID","membershipEnd":"2026-08-20"}'
```

Copy `backend/.env.example` to `backend/.env` if you want to override `PORT`,
`MONGODB_URI`, or `APP_CORS_ALLOWED_ORIGIN`.

Additional admin environment variables:

```text
JWT_SECRET
ADMIN_SEED_NAME
ADMIN_SEED_USERNAME
ADMIN_SEED_PASSWORD
CLIENT_URL
```

Create the first administrator:

```bash
cd backend
npm run seed:admin
```

## Verification

```bash
cd backend
npm run build
npm test

cd ../frontend
npm run build
```

## Completed and pending

Completed:

- MERN structure, Atlas connection, auth foundation, role-based routes
- Domain database models and indexes
- Admin/customer/partner/public REST route surface
- Dashboard summary APIs, membership status job, audit logging helper
- Slot-lock and double-booking backend validation foundation
- Manual payments, payment-order placeholders, webhook idempotency record
- Partner settlement records and ledger summaries
- Public website, feedback page, admin dashboard, customer dashboard, partner dashboard UI
- Demo seed data and credentials

Pending deeper production work:

- Real Razorpay/Stripe signature verification keys and webhook secrets
- Full PDF/CSV export implementation
- Cloudinary image upload validation
- Complete object-level authorization for every customer-owned resource
- Dedicated tests for every business workflow listed in the full specification
- Code splitting for the larger frontend dashboard bundle
