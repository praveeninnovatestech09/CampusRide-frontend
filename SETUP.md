# CampusRide — Local Setup

College carpooling platform: find rides, offer rides, split costs.

## Architecture

```text
campusride/
├── src/                  React frontend (TanStack Start + Tailwind CSS v4)
│   ├── routes/           Pages (file-based routing)
│   │   └── _authenticated/   Protected pages (dashboard, offer, bookings, ...)
│   ├── components/       Reusable UI (RideCard, Navbar, StatusBadge, ...)
│   └── lib/              API client, auth context, formatting helpers
└── server/               REST API (Node.js + Express + MongoDB/Mongoose)
    └── src/
        ├── config/       Database connection
        ├── models/       User, Ride, Booking, Notification
        ├── middleware/   JWT auth, zod validation, error handling
        └── routes/       auth, users, rides, bookings, notifications
```

Security: bcrypt password hashing (12 rounds), JWT bearer tokens, helmet, CORS allow-list,
rate-limited auth endpoints, zod validation on every write, and ownership checks
(only drivers accept/reject/cancel their rides; only passengers cancel their bookings).
Seat counts are decremented atomically to prevent overbooking.

## Prerequisites
- Node.js 18+
- MongoDB (local `mongod` or a free MongoDB Atlas cluster)

## 1. Start the API

```bash
cd server
cp .env.example .env        # then set MONGODB_URI and a long random JWT_SECRET
npm install
npm run dev                 # http://localhost:5000/api/health
```

## 2. Start the frontend

```bash
# from the project root
cp .env.example .env        # VITE_API_URL=http://localhost:5000/api
npm install                 # or bun install
npm run dev                 # http://localhost:8080
```

Make sure `CLIENT_ORIGIN` in `server/.env` matches the frontend URL.

## REST API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | – | Create account, returns JWT |
| POST | /api/auth/login | – | Log in, returns JWT |
| GET | /api/auth/me | ✓ | Current user |
| PUT | /api/users/me | ✓ | Update profile |
| GET | /api/rides?from&to&date&seats&maxPrice&sort | – | Search rides |
| GET | /api/rides/mine | ✓ | Rides I drive |
| GET | /api/rides/:id | – | Ride details |
| POST | /api/rides | ✓ | Offer a ride |
| PATCH | /api/rides/:id/cancel | driver | Cancel ride (notifies passengers) |
| POST | /api/rides/:id/bookings | ✓ | Request seats |
| GET | /api/bookings/mine | ✓ | My booking requests |
| GET | /api/bookings/requests | ✓ | Requests on my rides |
| PATCH | /api/bookings/:id/respond | driver | `{ status: "accepted" \| "rejected" }` |
| PATCH | /api/bookings/:id/cancel | passenger | Cancel booking |
| GET | /api/notifications | ✓ | List + unread count |
| PATCH | /api/notifications/read-all | ✓ | Mark all read |
| PATCH | /api/notifications/:id/read | ✓ | Mark one read |

## Demo flow
1. Register two accounts (use two browsers / a private window).
2. Account A: **Offer a ride**.
3. Account B: **Find rides** → open the ride → request a seat.
4. Account A: **Bookings → Requests on my rides** → accept. B receives a notification.
