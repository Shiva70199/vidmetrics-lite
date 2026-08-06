# DataBoard — Project Specification

xVector Labs take-home assessment. Authenticated users upload CSV datasets and analyze them.

## Authentication

- Register, Login, Logout
- JWT access tokens
- bcrypt password hashing
- Protected routes
- User session persistence
- Expired token handling
- Each user accesses only their own datasets

## Datasets

- Upload CSV with dataset name
- Validation: valid CSV, non-empty file, unique name per user, valid file type
- List datasets with pagination and search
- Preview first 25 rows
- Delete with confirmation dialog

## Analytics

- Compute min, max, sum for numeric columns only
- Handle: invalid column, missing column, empty dataset, null values

## Visualization

- Apache ECharts: scatter, line, bar
- Workflow: select dataset → X column → Y column → chart type → render
- Charts update immediately on selection change

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Create account |
| POST | /auth/login | Obtain JWT |
| GET | /auth/me | Current user |
| GET | /datasets | List (paginated, searchable) |
| POST | /datasets | Upload CSV |
| GET | /datasets/{id} | Dataset metadata |
| GET | /datasets/{id}/preview | First 25 rows |
| DELETE | /datasets/{id} | Delete dataset |
| GET | /datasets/{id}/columns | Column info |
| POST | /analytics/compute | Min/max/sum for column |
| GET | /dashboard/stats | Home page metrics |

## Tech Stack

- **Backend:** FastAPI, Pandas, SQLAlchemy, SQLite, JWT, bcrypt
- **Frontend:** Next.js 14, React, Tailwind CSS, Apache ECharts

## Tests Required

- Authentication (register, login, protected routes)
- CSV validation
- Pagination
- Compute endpoint
