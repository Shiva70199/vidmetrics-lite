# DataBoard

DataBoard is a full-stack CSV analytics dashboard. Authenticated users upload datasets, preview rows, compute statistics on numeric columns, and build bar, line, and scatter charts.

Evolved from the VidMetrics Lite UI shell — layout, cards, typography, and responsive patterns are preserved; business logic is replaced with dataset management and analytics.

## Architecture

```
DataBoard/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Home metrics + quick actions
│   ├── datasets/           # Upload, list, preview, delete
│   ├── analytics/          # Stats + ECharts visualizations
│   ├── login/ & register/  # Auth pages
│   └── layout.tsx          # Root layout + providers
├── components/             # Reusable UI (LayoutShell, Navbar, Sidebar, ECharts)
├── lib/                    # API client + auth context
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI entry
│   │   ├── auth.py         # JWT + bcrypt
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── services.py     # CSV + analytics logic
│   │   └── routers/        # REST endpoints
│   └── tests/              # Pytest suite
└── ProjectSpec.md          # Requirements source of truth
```

**Frontend:** Next.js 14, React, Tailwind CSS, Apache ECharts  
**Backend:** FastAPI, Pandas, SQLAlchemy, SQLite, JWT, bcrypt

## How to Run (no Cursor required)

You do **not** need Cursor to run or test this app. Use any terminal (PowerShell, CMD, or VS Code terminal) and a web browser.

### 1. Start the backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Start the frontend (new terminal)

```bash
npm install
copy .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome, Edge, or Firefox.

### 3. Run automated tests

```bash
cd backend
.venv\Scripts\activate
pytest -v
```

### 4. Manual smoke test

1. Register at `/register`
2. Upload a CSV on `/datasets`
3. Preview rows and delete a dataset
4. Open `/analytics` — compute stats and switch chart types
5. Check `/dashboard` for summary metrics
6. Log out from the navbar or sidebar

## Installation

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Signing key for access tokens | `change-me-in-production` |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `JWT_EXPIRE_MINUTES` | Token lifetime | `1440` |
| `DATABASE_URL` | SQLite connection | `sqlite:///./databoard.db` |
| `UPLOAD_DIR` | CSV storage path | `./uploads` |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:3000` |

### Frontend (`.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | FastAPI base URL | `http://localhost:8000` |

## Authentication

- **Register** — `POST /auth/register` with email + password (min 6 chars)
- **Login** — `POST /auth/login` returns a JWT bearer token
- **Logout** — `POST /auth/logout` (client clears stored token)
- **Session** — token stored in `localStorage`; sent as `Authorization: Bearer <token>`
- **Protected routes** — frontend redirects unauthenticated users; backend returns `401` for missing/expired tokens
- **Isolation** — each user can only access their own datasets

Passwords are hashed with bcrypt via passlib. Tokens are signed with HS256 and include an expiry claim.

## API Documentation

Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Obtain JWT |
| POST | `/auth/logout` | End session (client-side token discard) |
| GET | `/auth/me` | Current user |
| GET | `/datasets` | List datasets (pagination + search) |
| POST | `/datasets` | Upload CSV (multipart) |
| GET | `/datasets/{id}` | Dataset metadata |
| GET | `/datasets/{id}/preview` | First 25 rows |
| DELETE | `/datasets/{id}` | Delete dataset |
| GET | `/datasets/{id}/columns` | Column metadata |
| POST | `/analytics/compute` | Min / max / sum for numeric column |
| GET | `/dashboard/stats` | Home page metrics |

The frontend also uses `POST /datasets/{id}/chart-data` for ECharts series data (not listed in ProjectSpec but required for visualization).

## Testing

```bash
cd backend
.venv\Scripts\activate   # Windows
pytest -v
```

Coverage includes:

- Authentication (register, login, protected routes)
- CSV validation (empty, invalid type, duplicate name)
- Pagination and search
- Compute endpoint (numeric, invalid, non-numeric columns)

## Assumptions

- CSV files use a standard comma delimiter with a header row
- Dataset names are unique per user
- Preview is capped at 25 rows for performance
- Chart Y-axis must be a numeric column; X can be any column
- SQLite is sufficient for the take-home scope

## Future Improvements

- Refresh tokens and httpOnly cookie storage
- Column type inference overrides
- Dataset versioning and re-upload
- Export computed stats and chart images
- PostgreSQL for production deployments
- Server-side pagination on preview for very wide files

## Scripts

- `npm run dev` — Start Next.js dev server
- `npm run build` — Production build
- `npm run clean` — Remove stale Next.js build cache
- `uvicorn app.main:app --reload` — Start API (from `backend/`)
