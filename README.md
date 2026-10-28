# Blood Donor Finder – API

REST API for **Blood Donor Finder**, a mobile app that helps people find blood donors quickly and lets them post blood requests. Donors who match a request get a push notification.

Built with **Node.js, Express and MongoDB**.

- **Mobile app:** `https://github.com/ChamodyaIshani99/blood-donor-api`
- **Live API:** `https://blood-donor-api-lfzc.onrender.com/api/health`
- **Demo video:** <link>

> The API is hosted on Render's free tier, so the first request after a period of inactivity can take 30-60 seconds.

## Features

- **Authentication:** register and log in with email or mobile number, JWT tokens, bcrypt password hashing
- **Donor profiles:** blood group, district, area, availability toggle, last donation date, option to hide the phone number
- **Donor search:** filter by blood group, district and area, with pagination. Only available and eligible donors are returned.
- **Eligibility rule:** donors are hidden for 90 days after a donation
- **Blood requests:** create, list, edit, mark as fulfilled and delete. Requests are sorted by urgency (Critical, Urgent, Normal) and expire automatically after the needed-by date.
- **Push notifications:** when a request is posted, compatible donors in the same district are notified through Expo push notifications
- **Security:** input validation (Zod), rate limiting, Helmet, owner-only edits, phone numbers visible only to logged-in users

## Tech stack

| Area | Tools |
|---|---|
| Runtime / framework | Node.js (18+), Express |
| Database | MongoDB with Mongoose (MongoDB Atlas in production) |
| Auth | JWT (`jsonwebtoken`), `bcryptjs` |
| Validation | Zod |
| Security | Helmet, CORS, `express-rate-limit` |
| Push | `expo-server-sdk` |
| Testing | Node's built-in test runner |
| Hosting | Render (API), MongoDB Atlas (database) |

## Project structure

```
src/
├── config/        db.js, constants.js (blood groups, districts, compatibility table)
├── models/        User.js, BloodRequest.js
├── middleware/    auth.js (JWT), validate.js (Zod), error.js
├── controllers/   auth, user, donor, request
├── routes/        auth, user, donor, request
├── services/      notification.service.js (matching donors + Expo push)
├── utils/         asyncHandler, pagination, dates, request expiry job
├── app.js         middleware and routes
└── server.js      database connection and server start
scripts/           seed.js (demo data)
tests/             notification.test.js
render.yaml        Render deployment blueprint
```

## Getting started

### Prerequisites
- Node.js 18 or newer
- A MongoDB database (local, or a free MongoDB Atlas cluster)

### Setup

```bash
git clone <repo-url>
cd blood-donor-api
npm install
cp .env.example .env      # Windows: copy .env.example .env
```

Fill in `.env`:

| Variable | Description |
|---|---|
| `PORT` | Server port (default `5000`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string used to sign tokens |
| `JWT_EXPIRES_IN` | Token lifetime, for example `7d` |
| `NODE_ENV` | `development` or `production` |

Start the server:

```bash
npm run dev
```

Check it works: `http://localhost:5000/api/health` should return `{ "status": "ok" }`.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start with nodemon (auto restart) |
| `npm start` | Start for production |
| `npm test` | Run unit tests (no database needed) |
| `npm run seed` | Add demo donors and requests (login `donor1@seed.test` / `password123`) |
| `npm run reset -- --yes` | Delete **all** users and requests (be careful which database `MONGO_URI` points to) |

## API reference

Base path: `/api`. All endpoints except health, register and login need the header
`Authorization: Bearer <token>`.

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create an account, returns `{ token, user }` |
| POST | `/auth/login` | Log in with `identifier` (email or phone) and `password` |

Register body:

```json
{
  "name": "Test Donor",
  "phone": "0771234567",
  "email": "test@example.com",
  "password": "password123",
  "bloodGroup": "O+",
  "district": "Colombo",
  "area": "Maharagama"
}
```

### Users

| Method | Path | Description |
|---|---|---|
| GET | `/users/me` | Current user |
| PUT | `/users/me` | Update name, blood group, district, area, `showPhone`, `lastDonationDate` |
| PATCH | `/users/me/availability` | `{ "isAvailable": true }` |
| POST | `/users/me/push-token` | Save the Expo push token `{ "token": "ExponentPushToken[...]" }` |
| DELETE | `/users/me/push-token` | Remove the push token (call on logout) |

### Donors

| Method | Path | Description |
|---|---|---|
| GET | `/donors` | Search donors |
| GET | `/donors/:id` | Single donor |

Query parameters for `GET /donors`: `bloodGroup`, `district`, `area`, `page` (default 1), `limit` (default 10, max 50).
Note that `+` must be sent as `%2B` (for example `bloodGroup=O%2B`). The response includes
`meta: { page, limit, total, totalPages }`. A donor's `phone` is `null` if they chose to hide it.

### Blood requests

| Method | Path | Description |
|---|---|---|
| POST | `/requests` | Create a request (max 10 per hour per IP) |
| GET | `/requests` | Feed. Filters: `bloodGroup`, `district`, `urgency`, `status` (default `open`), `page`, `limit` |
| GET | `/requests/mine` | The current user's requests (`status`, `page`, `limit`) |
| GET | `/requests/:id` | Request details |
| PUT | `/requests/:id` | Edit (owner only, open requests only) |
| PATCH | `/requests/:id/status` | `{ "status": "fulfilled" }` (owner only) |
| DELETE | `/requests/:id` | Delete (owner only) |

Create body:

```json
{
  "bloodGroup": "A+",
  "units": 2,
  "hospital": "National Hospital",
  "district": "Colombo",
  "urgency": "Urgent",
  "neededBy": "2026-11-10",
  "contactPhone": "0771234567",
  "patientName": "optional",
  "note": "optional"
}
```

### Errors

Errors return JSON with a `message`. Validation errors (`400`) also include an `errors` array with `field` and `message`.
Other codes used: `401` (not authenticated), `403` (not the owner), `404`, `409` (phone or email already registered), `429` (rate limited).

## How push notifications work

1. A user posts a blood request.
2. The server finds donors who:
   - have a blood group that can give to the patient (see the table below),
   - live in the same district,
   - are available and eligible (no donation in the last 90 days),
   - have a saved push token (the requester is excluded).
3. The notifications are sent in batches through Expo's push service. The payload carries `{ type: "blood_request", requestId }` so the app can open the request when it is tapped. The contact number is never put in the notification.
4. Tokens that are no longer valid (`DeviceNotRegistered`) are removed automatically.

| Patient needs | Compatible donors |
|---|---|
| A+ | A+, A-, O+, O- |
| A- | A-, O- |
| B+ | B+, B-, O+, O- |
| B- | B-, O- |
| AB+ | everyone |
| AB- | AB-, A-, B-, O- |
| O+ | O+, O- |
| O- | O- |

## Deployment (Render + MongoDB Atlas)

1. **Atlas:** create a free cluster and a database user. In *Network Access* allow `0.0.0.0/0` (Render's free tier has no fixed IP). Copy the connection string and add the database name:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/blood_donor_finder?retryWrites=true&w=majority`
2. **GitHub:** push the project (`.env` is git-ignored, never commit it).
3. **Render:** *New, Blueprint*, select the repo. It reads `render.yaml`. Paste `MONGO_URI` when asked; `JWT_SECRET` is generated for you.
4. Open `https://<your-service>.onrender.com/api/health` to confirm.


**Ishani Chamodya**
[LinkedIn](https://linkedin.com/in/chamodya10/) · [GitHub](https://github.com/ChamodyaIshani99)