# NGO EventFlow Backend – Setup Guide

Follow these steps to run the backend locally after cloning from GitHub.

## 1) Prerequisites
- Node.js 18+ (22 tested)
- npm
- MongoDB:
  - Atlas SRV URI **or** local MongoDB instance
- A long random `JWT_SECRET` (≥32 chars)

## 2) Clone and install
```bash
git clone https://github.com/<your-org>/<your-repo>.git
cd <your-repo>/backend
npm install
```

## 3) Environment variables
Create a file named `.env` in `backend/` (same level as `package.json`):
```env
PORT=5000
MONGO_URI=mongodb+srv://<db_username>:<db_password>@cluster0.huoflym.mongodb.net/?appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-this
```
Notes:
- Do **not** wrap values in quotes.
- Ensure the key names are exact (`MONGO_URI`, `JWT_SECRET`).
- If using MongoDB Atlas, whitelist your IP and include db name in the URI.

## 4) Run the server
```bash
npm run dev   # nodemon
# or
npm start     # plain node
```
The API should log: `Server running on port 5000` and `MongoDB connected`.

## 5) Quick health check
Open or curl:
```bash
curl http://localhost:5000
```
Expect: `{"message":"NGO EventFlow API"}`

## 6) Seed initial users (manual via API)
Use Postman/Thunder Client/curl:
- Register Admin:
  ```bash
  POST /api/auth/register
  {
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "password123",
    "role": "Admin"
  }
  ```
- Register Event Manager and Team Member similarly.
- Save the returned `token` for auth-protected requests.

## 7) Auth usage
Add this header to protected endpoints:
```
Authorization: Bearer <token>
```

## 8) Core endpoints (high level)
- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- Events (auth required):
  - `GET /api/events` (Team Members see volunteer-view)
  - `POST /api/events` (Event Manager only)
  - `GET /api/events/:id`
- Tasks (auth required):
  - `GET /api/tasks` (Team Members see assigned/open)
  - `POST /api/tasks` (Event Manager only)
  - `PATCH /api/tasks/:id` (Team Member can update own status/progress; managers/admins any field)
  - `DELETE /api/tasks/:id` (Admin or Event Manager)
- Admin: `GET /api/admin/dashboard` (Admin only)

## 9) Common pitfalls
- `.env` not in `backend/` or missing `MONGO_URI`/`JWT_SECRET`.
- Atlas IP not whitelisted → auth/connection failures.
- Wrong role used on restricted endpoints → 403.

## 10) Optional extras
- Import the provided `API_TESTING_GUIDE.md` for detailed request/response samples.
- Add linting/testing as needed.

