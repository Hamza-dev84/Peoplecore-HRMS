#Peoplecore-HRMS Enterprise: Employee Management System

A full-stack **Human Resource Management System** built with **Next.js**, **Express.js**, **MongoDB** and **TypeScript**. It covers authentication, role-based access control, employee management, attendance, leave workflows, notifications, dashboards and CSV/PDF reports.

> **Status:** The backend API is complete and tested. The frontend is in active development (design system and reusable UI components are done, pages are being built). See the [Roadmap](#roadmap).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Roles and Permissions](#roles-and-permissions)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Security](#security)
- [Screenshots](#screenshots)
- [Roadmap](#roadmap)
- [Deployment](#deployment)
- [Author](#author)

---

## Features

### Authentication
- Register, login, logout
- JWT access token (15 min) + refresh token (7 days) stored in an **httpOnly cookie**
- Refresh tokens are stored **hashed** in the database and rotated on every refresh
- Email verification, forgot password, reset password (tokens are hashed, single-use and expire)
- Change password (invalidates existing sessions)
- Passwords hashed with **bcrypt**

### Role-Based Access Control (RBAC)
- Three roles: **Super Admin**, **HR**, **Employee**
- Reusable `authorizeRoles(...)` middleware on every protected route
- Business rules, for example: HR cannot modify a Super Admin, nobody can review their own leave

### Employee Management
- Add, view, edit and deactivate employees (soft delete keeps attendance and leave history)
- HR/Admin creates an employee and a temporary password is emailed to them
- Own profile view/edit and profile image upload (type and size validated)
- **Server-side search** (name, email), department filter and pagination

### Attendance
- One check-in per day, check-out allowed multiple times (the last check-out is kept)
- Company time zone support (default `Asia/Karachi`), timestamps stored in UTC
- Attendance history with date filters and monthly summary report

### Leave Management
- Apply, view, approve, reject, cancel
- Statuses: `pending`, `approved`, `rejected`, `cancelled`
- Overlapping leave detection, past-date validation, rejection requires a comment
- Atomic status updates to prevent double reviews

### Notifications
- In-app notifications (new leave request, leave approved/rejected, HR announcements)
- Email notifications for leave decisions
- Unread count, mark as read, mark all as read, delete

### Dashboard
- Role-based data from a single endpoint
- Employee: today's attendance, monthly summary, leave stats, upcoming leaves, recent activity
- HR/Admin: employee stats, department breakdown, today's attendance, 7-day attendance trend, leave stats, recent requests

### Reports
- Export **CSV** and **PDF** for employees, attendance and leaves
- CSV exports are protected against spreadsheet formula injection

---

## Tech Stack

### Backend
| Area | Technology |
|---|---|
| Runtime / Framework | Node.js, Express.js |
| Language | TypeScript |
| Database | MongoDB with Mongoose |
| Auth | JWT, bcrypt, cookie-parser |
| Email | Nodemailer |
| File upload | Multer |
| Reports | PDFKit |
| Security | Helmet, CORS, express-rate-limit |

### Frontend
| Area | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI | Custom reusable component library, lucide-react icons |
| Notifications | react-hot-toast |

---

## Project Structure

```text
HRMS/
├── backend/
│   ├── config/            # Database connection
│   ├── controllers/       # Request handlers (auth, employee, attendance, leave, ...)
│   ├── middleware/        # auth, role check, rate limiter, upload, error handler
│   ├── models/            # Mongoose models (User, Attendance, Leave, Notification)
│   ├── routes/            # Route definitions
│   ├── types/             # Express type extensions
│   ├── utilities/         # asyncWrapper, ApiError, response helpers, tokens, email, reports
│   ├── uploads/           # Uploaded profile images (git-ignored)
│   └── server.ts          # App entry point
│
└── frontend/
    └── src/
        ├── app/           # Next.js routes (App Router)
        ├── components/ui/ # Reusable UI components
        ├── lib/           # Helpers
        ├── features/      # Feature modules (in progress)
        ├── hooks/         # Custom hooks (in progress)
        ├── services/      # API service layer (in progress)
        └── types/         # Shared TypeScript types (in progress)
```

### Backend request flow

```text
Request → Helmet → CORS → Rate limiter → Route → protect (JWT) → authorizeRoles (RBAC)
        → Controller → Mongoose model → Response
Any error → centralized error handler → consistent JSON response
```

---

## Roles and Permissions

| Feature | Super Admin | HR | Employee |
|---|:---:|:---:|:---:|
| Change user roles | Yes | No | No |
| Add / edit employees | Yes | Yes | No |
| Deactivate employees | Yes | No | No |
| View employee list | Yes | Yes | No |
| Own profile (view/edit) | Yes | Yes | Yes |
| Check-in / check-out | Yes | Yes | Yes |
| View all attendance | Yes | Yes | Own only |
| Apply / cancel own leave | Yes | Yes | Yes |
| Approve / reject leave | Yes | Employee leaves only | No |
| Send announcements | Yes | Yes | No |
| Dashboard | Company-wide | Company-wide | Personal |
| Employee report | Yes | Yes | No |

The first user to register automatically becomes **Super Admin**. Every later registration is an **Employee**.

---

## Getting Started

### Prerequisites
- Node.js 20 or newer
- MongoDB (local installation or a free MongoDB Atlas cluster)
- An SMTP account for emails (Gmail with an App Password, or Mailtrap for testing)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/` (see [Environment Variables](#environment-variables)), then run:

```bash
npm run dev
```

The API runs on `http://localhost:5000`. You should see:

```text
MongoDB connected
Server Running on PORT 5000
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:3000`. A preview of all reusable UI components is available at `http://localhost:3000/components-preview`.

### 4. Build for production

```bash
# backend
npm run build
npm start

# frontend
npm run build
npm start
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|:---:|---|
| `PORT` | No | Server port (default `5000`) |
| `NODE_ENV` | No | `development` or `production` |
| `MONGO_URI` | Yes | MongoDB connection string |
| `FRONTEND_URL` | Yes | Frontend origin used for CORS and email links (e.g. `http://localhost:3000`) |
| `JWT_ACCESS_SECRET` | Yes | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh tokens (use a different value) |
| `EMAIL_HOST` | For email | SMTP host (e.g. `smtp.gmail.com`) |
| `EMAIL_PORT` | For email | SMTP port (e.g. `587`) |
| `EMAIL_USER` | For email | SMTP username |
| `EMAIL_PASSWORD` | For email | SMTP password or app password |
| `TIMEZONE` | No | Company time zone for attendance (default `Asia/Karachi`) |

Generate strong secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

The server refuses to start if `MONGO_URI`, `JWT_ACCESS_SECRET` or `JWT_REFRESH_SECRET` is missing.

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:5000/api`) |

---

## API Overview

Base URL: `http://localhost:5000/api`

### Response format

```json
{ "success": true, "message": "Employee created successfully", "data": {} }
```
```json
{ "success": false, "message": "Employee not found" }
```

Unexpected server errors never expose internal details to the client.

### Endpoints

**Auth** (`/api/auth`)

| Method | Endpoint | Access |
|---|---|---|
| POST | `/register` | Public |
| POST | `/login` | Public |
| POST | `/refresh-token` | Cookie |
| POST | `/logout` | Public |
| GET | `/me` | Authenticated |
| POST | `/verify-email` | Public |
| POST | `/resend-verification` | Public |
| POST | `/forgot-password` | Public |
| POST | `/reset-password` | Public |
| PATCH | `/change-password` | Authenticated |

**Users** (`/api/users`)

| Method | Endpoint | Access |
|---|---|---|
| PATCH | `/:id/role` | Super Admin |

**Employees** (`/api/employees`)

| Method | Endpoint | Access |
|---|---|---|
| GET | `/` (query: `page`, `limit`, `search`, `department`) | HR, Super Admin |
| GET | `/departments` | HR, Super Admin |
| POST | `/` | HR, Super Admin |
| GET | `/:id` | HR, Super Admin |
| PATCH | `/:id` | HR, Super Admin |
| DELETE | `/:id` (deactivate) | Super Admin |
| GET / PATCH | `/profile` | Authenticated |
| PATCH | `/profile/image` | Authenticated |

**Attendance** (`/api/attendance`)

| Method | Endpoint | Access |
|---|---|---|
| POST | `/check-in` | Authenticated |
| POST | `/check-out` | Authenticated |
| GET | `/today` | Authenticated |
| GET | `/` (query: `from`, `to`, `userId`, `page`, `limit`) | Authenticated (employees see own) |
| GET | `/report` (query: `month`, `userId`) | Authenticated (employees see own) |

**Leaves** (`/api/leaves`)

| Method | Endpoint | Access |
|---|---|---|
| POST | `/` | Authenticated |
| GET | `/` (query: `status`, `userId`, `page`, `limit`) | Authenticated (employees see own) |
| GET | `/my` | Authenticated |
| GET | `/:id` | Owner, HR, Super Admin |
| PATCH | `/:id/approve` | HR, Super Admin |
| PATCH | `/:id/reject` | HR, Super Admin |
| PATCH | `/:id/cancel` | Owner |

**Notifications** (`/api/notifications`)

| Method | Endpoint | Access |
|---|---|---|
| GET | `/` | Authenticated |
| GET | `/unread-count` | Authenticated |
| PATCH | `/read-all` | Authenticated |
| PATCH | `/:id/read` | Authenticated |
| DELETE | `/:id` | Authenticated |
| POST | `/announcement` | HR, Super Admin |

**Dashboard** (`/api/dashboard`)

| Method | Endpoint | Access |
|---|---|---|
| GET | `/` | Authenticated (data depends on role) |

**Reports** (`/api/reports`, add `?format=csv` or `?format=pdf`)

| Method | Endpoint | Access |
|---|---|---|
| GET | `/employees` | HR, Super Admin |
| GET | `/attendance` | Authenticated (employees see own) |
| GET | `/leaves` | Authenticated (employees see own) |

Protected endpoints expect the header `Authorization: Bearer <accessToken>`.

---

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT access tokens are short-lived; refresh tokens live in an httpOnly, `secure` (in production), `sameSite` cookie
- Refresh, email-verification and password-reset tokens are stored as SHA-256 hashes
- Helmet security headers and CORS restricted to the configured frontend origin
- Rate limiting on the whole API, with a stricter limit on login, register and password flows
- Request body size limits
- Role checks on the server for every protected route (the frontend only hides UI)
- Generic error messages for unexpected errors, no user enumeration on login and forgot-password
- Input validation on all write endpoints, uploads restricted by type and size
- Required environment variables are checked at startup

---

## Roadmap

### Backend
   Project setup, centralized error handling, MongoDB connection
   Authentication (JWT, refresh tokens, email verification, password reset)
   Employee management with search, filters and pagination
   Profile image upload
   Attendance
   Leave management
   Notifications (in-app and email)
   Role-based dashboard API
   CSV and PDF reports
   Security hardening

### Frontend
   Design system and reusable UI components
   API service layer and authentication handling
   Login, register, forgot/reset password pages
   Protected routes and role-based navigation
   Dashboard layout (sidebar, navbar, profile menu)
   Employees module (table, search, filters, forms)
   Attendance module
   Leave module
   Dashboards with charts
   Notifications and reports UI

### Planned extras
  Real-time notifications with Socket.io
  AI leave request writer

---

**Author**

**Hamza**, Full-Stack Developer

