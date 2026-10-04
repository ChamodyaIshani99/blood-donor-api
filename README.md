# Blood Donor Finder – API

Node.js + Express + MongoDB backend.

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill the values
3. Make sure MongoDB is running (local or Atlas URI)
4. `npm run dev`

All routes except health/register/login need `Authorization: Bearer <token>`.

## Endpoints
| Method | Path | Notes |
|---|---|---|
| GET | /api/health | |
| POST | /api/auth/register | |
| POST | /api/auth/login | email or phone + password |
| GET | /api/users/me | |
| PUT | /api/users/me | |
| PATCH | /api/users/me/availability | `{ "isAvailable": true }` |
| POST | /api/users/me/push-token | `{ "token": "ExponentPushToken[...]" }` |
| DELETE | /api/users/me/push-token | call on logout |
| GET | /api/donors | `?bloodGroup=O%2B&district=Colombo&area=&page=1&limit=10` |
| GET | /api/donors/:id | |
| POST | /api/requests | create request |
| GET | /api/requests | `?bloodGroup=&district=&urgency=&status=open&page=&limit=` |
| GET | /api/requests/mine | `?status=&page=&limit=` |
| GET | /api/requests/:id | |
| PUT | /api/requests/:id | owner only, open requests only |
| PATCH | /api/requests/:id/status | owner only, `{ "status": "fulfilled" }` |
| DELETE | /api/requests/:id | owner only |

Note: `+` in a query string must be sent as `%2B` (axios `params` does this for you).

## Push notifications
When a request is created, donors who are compatible with the patient's blood group
(see `COMPATIBLE_DONORS`), in the same district, available, eligible and with a push token
get an Expo push. Payload `data`: `{ type: "blood_request", requestId }`.
Invalid tokens (`DeviceNotRegistered`) are cleaned up automatically.

## Scripts
- `npm run dev` – start with nodemon
- `npm test` – unit tests (no database needed)
- `npm run seed` – sample donors + requests (login `donor1@seed.test` / `password123`)

## Deploy (Render / Railway)
Build: `npm install`, Start: `npm start`.
Env vars: `MONGO_URI` (MongoDB Atlas), `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV=production`.
