# HomeServe Technologies — SaaS Home Services Booking Platform

A modern, responsive, secure, and production-ready multi-vendor Home Services Booking SaaS platform built for scale. HomeServe Technologies connects customers with verified local service providers (electricians, plumbers, AC technicians, cleaners, painters, carpenters, appliance repair) across four role-based portals: **Super Admin**, **Customer**, **Service Provider**, and **Technician**.

---

## ⚡ 1-Click Instant Cloud Deployment

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/tops212245-dotcom/vibe_coding_project1)
&nbsp;&nbsp;
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/tops212245-dotcom/vibe_coding_project1)

---

## 🚀 Key Highlights & Evaluation Compliance

| Area | Implementation & Coverage |
| :--- | :--- |
| **User Roles (4)** | Super Admin, Customer, Service Provider, Technician |
| **Functional Modules (10)** | Authentication/RBAC, Customer Mgmt, Categories/Catalog, Provider Mgmt, Bookings/Slots, Technician Dispatch, Payments/Invoices, Notifications, Reviews/Complaints, Analytics |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, TanStack Query, React Router v6 |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy ORM, Pydantic v2, Alembic, Uvicorn |
| **Database** | Relational normalized schema (33 tables), SQLite (local) / MySQL 8.0 (production) |
| **Security** | JWT access/refresh token rotation, bcrypt password hashing, RBAC route guards, row-level data segregation |
| **Payments** | Razorpay Test Mode integration + local simulated payment gateway fallback |
| **Testing** | Pytest unit/integration test suite, Playwright E2E automation, Postman v2.1 collection |
| **Deployment** | Vercel / Netlify (`vercel.json`, `netlify.toml`) + Render (`render.yaml`) |

---

## 👥 User Roles & Demo Credentials

The platform includes seed data with pre-configured accounts for all four user roles:

| Role | Email | Password | Access / Portal URL |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@homeserve.com` | `AdminPassword123!` | `/admin` |
| **Customer** | `customer@homeserve.com` | `CustomerPass123!` | `/customer` |
| **Service Provider** | `provider@homeserve.com` | `ProviderPass123!` | `/provider` |
| **Technician** | `tech@homeserve.com` | `TechPass123!` | `/technician` |

---

## 📦 10 Functional Modules Architecture

1. **Authentication & Authorization (RBAC)**: Role-based registration (Customer, Provider), JWT access and refresh token rotation, bcrypt hashing, forgot/reset password flows, protected route guards.
2. **Customer Management**: Profile management, multiple address book entries (Home/Work/Other), service favorites, appointment history, order tracking.
3. **Service Category & Catalog**: Multi-level category hierarchy (Categories -> Subcategories -> Services), duration, base pricing, thumbnail galleries, faceted search and price filters.
4. **Service Provider Management**: Provider profile, KYC document upload and verification approval workflow, working hours schedule, service area definition, commissions.
5. **Booking & Appointment Management**: Available time slot calculation, customer address selection, notes, photo attachments, appointment booking, rescheduling, cancellation, and concurrency-safe double-booking prevention.
6. **Technician Dispatch & Management**: Provider assigns technicians to confirmed bookings; technician portal with timeline progress (En Route, Arrived, In Progress, Completed), work completion notes, and before/after job images.
7. **Payment & Invoice Management**: Dynamic price calculation, platform commission splitting (e.g. 15%), coupon discounts, Razorpay Test Mode + payment simulation fallback, auto-generated invoices and payment receipts.
8. **Notification & Communication System**: In-app notification center for booking status transitions, technician arrival, invoice alerts, and administrator notices.
9. **Rating, Review & Dispute Management**: Verified customer ratings & star reviews, provider public responses, support ticket / complaint escalation with admin resolution lifecycle.
10. **Analytics & SaaS Dashboards**:
    - **Admin**: GMV, total bookings, platform commissions, provider verification queue, active dispute count.
    - **Provider**: Total earnings, today's schedule, monthly revenue, average star rating.
    - **Customer**: Upcoming appointments, payment history, invoices.
    - **Technician**: Completed jobs, daily route, performance metrics.

---

## 📂 Repository Directory Layout

```text
Vibe_coding_project/
├── backend/                  # FastAPI Application
│   ├── alembic/              # Database migration version scripts
│   ├── app/
│   │   ├── api/v1/           # 15 Modular REST API routers
│   │   ├── core/             # App settings, DB engine, JWT security, RBAC
│   │   ├── models/           # 33+ Normalized SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic v2 validation schemas
│   │   ├── main.py           # FastAPI entrypoint, CORS, lifespan & seed
│   │   └── seed.py           # Demo dataset seeder
│   ├── tests/                # Pytest unit & integration test suite
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Backend environment template
├── frontend/                 # React 18 + TypeScript Application
│   ├── src/
│   │   ├── components/       # Reusable UI component library (Buttons, Modals, Cards, Badges)
│   │   ├── context/          # AuthContext for role session & JWT storage
│   │   ├── layouts/          # PublicLayout, AuthLayout, DashboardLayout
│   │   ├── pages/            # Public, Customer, Provider, Technician, Admin pages
│   │   ├── routes/           # ProtectedRoute with RBAC checks
│   │   ├── services/         # Axios API client with automatic token refresh
│   │   └── types/            # TypeScript interfaces
│   ├── package.json          # Node dependencies
│   ├── vercel.json           # Vercel deployment rewrites
│   └── netlify.toml          # Netlify deployment rewrites
├── docs/                     # Full SDLC Specification Documents
│   ├── requirements.md       # Functional & non-functional requirements
│   ├── architecture.md       # High-level & low-level architecture
│   ├── database-design.md    # 33-table schema & normalization documentation
│   ├── er-diagram.md         # Mermaid ER diagram
│   ├── api-documentation.md  # REST API specification
│   └── security-checklist.md # Security audit & hardening checklist
├── postman/                  # Postman v2.1 Collection & Environment files
│   ├── homeserve_postman_collection.json
│   └── homeserve_environment.json
├── e2e/                      # Playwright E2E Test Suite
│   ├── tests/                # Automated browser test specs (auth, marketplace, booking)
│   ├── playwright.config.ts  # Playwright configuration
│   └── package.json
├── render.yaml               # Render Cloud Blueprint for backend & DB
├── DEVELOPMENT_LOG.md        # Comprehensive AI Vibe Coding & SDLC log
├── .env.example              # Master configuration template
└── README.md                 # Project documentation
```

---

## 🛠️ Quickstart & Local Setup Guide

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ & npm 9+
- Git

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations and bootstrap seed data
python -c "from app.core.database import SessionLocal, Base, engine; from app.seed import seed_database; Base.metadata.create_all(bind=engine); db = SessionLocal(); seed_database(db); db.close()"

# Start FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Interactive Swagger API Documentation: `http://127.0.0.1:8000/docs`
- ReDoc API Documentation: `http://127.0.0.1:8000/redoc`

### 3. Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
- Open browser at `http://localhost:5173`

---

## 🧪 Testing Guide

### 1. Backend Testing (Pytest)
Run the automated unit and integration tests covering authentication, double-booking prevention, commission calculations, and marketplace queries:
```bash
cd backend
python -m pytest -v
```
*Result: 14 passing test suites (100% pass rate).*

### 2. API Testing (Postman)
1. Open Postman.
2. Click **Import** and select `postman/homeserve_postman_collection.json` and `postman/homeserve_environment.json`.
3. Set active environment to **HomeServe Local Environment**.
4. Run requests in folder order `01. Authentication` -> `05. Bookings` -> `07. Payments` -> `10. Analytics`.

### 3. End-to-End Automation Testing (Playwright)
Run the automated end-to-end user journey tests across all role dashboards:
```bash
cd e2e
npm install
npx playwright test
```

---

## 🌐 Production Deployment

### Frontend (Vercel / Netlify)
- **Vercel**: Import repository root, set root directory to `frontend`, build command `npm run build`, output directory `dist`. `vercel.json` provides SPA routing rules.
- **Netlify**: Import repository, set build directory `frontend`, build command `npm run build`, publish directory `frontend/dist`. `netlify.toml` handles redirects.

### Backend (Render)
- Deploy using the included `render.yaml` Blueprint or create a **Web Service** on Render pointing to `backend/`.
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Configure `DATABASE_URL` (MySQL or PostgreSQL) and `CORS_ORIGINS` to point to your live frontend URL.

---

## 🛡️ Security Implementation
- **Password Protection**: Passwords hashed using standard `bcrypt` with salt rounds.
- **JWT Protection**: Short-lived access tokens (60m) paired with refresh tokens (7d) validated via HS256 algorithm.
- **Role-Based Access Control (RBAC)**: All endpoints enforced with role dependencies (`get_current_active_user`, `require_admin`, `require_provider`, `require_technician`).
- **Data Segregation**: Customers and providers can strictly view and mutate only their own resources.
- **Concurrency Safety**: Double booking prevention enforced via transactional validation before state transition.

