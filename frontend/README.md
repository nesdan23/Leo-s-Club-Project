# Leos Club EventFlow — Frontend

Modern React + TypeScript + Vite frontend for the NGO EventFlow API. Light mode first, soft minimal dashboard aesthetic.

## Stack

- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** (soft shadows, rounded-2xl, pastel accents)
- **React Query** (TanStack Query) + **Axios** for API
- **Zustand** (auth state, persisted)
- **React Router v6**
- **Lucide React** icons

## Design

- Soft minimal dashboard, light mode first
- Pastel metric cards (yellow, lavender, mint, sky)
- Rounded corners (rounded-2xl), subtle shadows
- Clean typography, generous whitespace
- Card-based layout, status badges, metric cards

## Scripts

```bash
npm install
npm run dev    # dev server with API proxy to backend
npm run build
npm run preview
```

## Environment

Create `.env` in `frontend/` (optional):

```env
VITE_API_URL=http://localhost:5000/api
```

If omitted, the app uses relative `/api` (rely on Vite proxy in dev).

## Backend

Ensure the backend is running on port 5000 (or set `VITE_API_URL`). Proxy is configured in `vite.config.ts`: `/api` → `http://localhost:5000`.

## Feature map (from backend)

- **Auth**: Login, Register (no forgot password)
- **Dashboard**: Admin metrics (events + task stats); all users see recent events + my tasks
- **Events**: List, detail, create (Event Manager), import volunteers (Event Manager), view volunteers (Manager/Admin)
- **Tasks**: List my tasks, update status/completion (Team Member), delete (Admin/Event Manager)

Roles: **Admin**, **Event Manager**, **Team Member**.
