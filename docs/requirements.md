# HomeServe Technologies — System Requirements Specification (SRS)

## 1. Executive Summary & Objective
HomeServe Technologies is a multi-tenant, multi-vendor SaaS marketplace connecting homeowners and businesses with vetted local service professionals across eight core home-service categories:
1. Electrical Services
2. Plumbing Services
3. AC Repair and Maintenance
4. Home Cleaning
5. Painting Services
6. Carpentry Services
7. Appliance Repair
8. Pest Control

The platform enforces end-to-end operational rigor: customer service discovery, slot-based booking with double-booking prevention, provider quote/acceptance, technician field dispatch with mobile-friendly checklists, escrow/commission-aware payment processing via Razorpay, automated invoice generation, verified customer reviews, and administrative compliance oversight.

---

## 2. Actors & Role-Based Permissions (RBAC)

| Role | Scope & Permissions | Key User Workflows |
|---|---|---|
| **SUPER ADMIN** | Complete platform governance, system configuration, provider vetting, dispute resolution, financial auditing | Review KYC documents, approve/reject providers, manage master categories, view cross-platform analytics, export CSV reports, adjust commission rates |
| **SERVICE PROVIDER** | Vendor business management, service catalog, coverage areas, technician fleet management, booking dispatch | Configure working hours & time slots, define pricing & duration, accept/reject booking requests, assign technicians, inspect earnings & payouts |
| **TECHNICIAN** | Field operations execution, assigned ticket fulfillment, service milestone updates | View assigned route & customer address, acknowledge assignment, mark arrival on-site, upload before/after photos, mark completion |
| **CUSTOMER** | Consumer marketplace engagement, service booking, payment checkout, service tracking, post-service feedback | Search & filter services, inspect provider verification badges, schedule slot, pay via Razorpay / sandbox simulation, track progress live, download invoices, submit reviews |

---

## 3. Core Functional Requirements

### 3.1 Authentication & User Lifecycle (Module 1)
- **Registration**: Separate self-serve registration flows for Customers and Service Providers; Technicians are invited/created by their employer Provider or Super Admin.
- **Credential Storage**: Passwords hashed using bcrypt / Argon2 with individual salts; plain text is never stored or logged.
- **Tokens**: JWT authentication using short-lived Access Tokens (15–60 mins) and rotatable Refresh Tokens (7 days) stored securely.
- **Account State Machine**: `ACTIVE`, `PENDING_VERIFICATION`, `SUSPENDED`, `INACTIVE`. Only `ACTIVE` users can authenticate; unverified providers cannot receive bookings.
- **Admin Bootstrap**: Automated initial admin seeding using environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`), avoiding hardcoded values.

### 3.2 Customer Management (Module 2)
- Multi-address wallet supporting street address, apartment/suite, city, state, postal code, and geocoordinates/landmarks.
- Real-time selection of active service address during checkout.
- Favorite providers list for rapid re-booking.
- Customer booking history with filterable statuses and downloadable tax invoices.

### 3.3 Dynamic Category & Service Catalog (Module 3)
- Hierarchical structure: Category -> Subcategory -> Master Service -> Provider Service Customization.
- Support dynamic addition of categories and subcategories by Super Admin without code deployment.
- Rich service listings: base pricing, price units (fixed, hourly, per unit), estimated duration in minutes, inclusions/exclusions, and media gallery.

### 3.4 Provider Onboarding & Compliance (Module 4)
- Verification workflow: Provider submits government photo ID, business license/registration, insurance certificate, and service coverage zip codes.
- Status transition: `PENDING` -> `APPROVED` | `REJECTED` | `SUSPENDED`.
- Working schedule management: per-day operating hours, shift buffer times, and max concurrent jobs.
- Automated public profile badge for verified providers.

### 3.5 Booking Engine & Double-Booking Protection (Module 5)
- Slot scheduling with provider availability validation taking into account service duration and existing commitments.
- **Concurrency & Double-Booking Guard**: Backend database transaction isolation with row-level locks (`SELECT ... FOR UPDATE`) or atomic slot reservation checks to guarantee zero overlapping confirmed appointments for the same provider.
- State machine:
  `PENDING` -> `CONFIRMED` -> `PROVIDER_ASSIGNED` -> `IN_PROGRESS` -> `COMPLETED`
  Alternative terminal paths: `CANCELLED` (by customer or provider within SLA), `REJECTED` (by provider).
- Rescheduling workflow with historical audit trail.

### 3.6 Technician Dispatch & Field Service (Module 6)
- Provider assigns authorized in-house technicians to confirmed bookings.
- Real-time job timeline tracking:
  - Step 1: Assignment Acknowledged
  - Step 2: En Route / Arrived at Location (with arrival timestamp)
  - Step 3: Job In Progress (upload pre-service inspection photo)
  - Step 4: Job Completed (upload post-service completion photo & notes)
- Technician performance analytics: completed tasks, punctuality, and ratings.

### 3.7 Payments, Commissions & Invoicing (Module 7)
- Dual integration mode: Razorpay Test Mode gateway for production parity, and a mock Payment Simulator for offline local development and CI testing.
- Calculation engine:
  - `Base Service Price` + `Add-ons` - `Coupon Discount` = `Net Service Amount`
  - `Tax (GST/VAT)` calculated according to system rates.
  - `Platform Commission` automatically deducted based on category/provider commission tiers.
  - `Provider Earning` = `Net Service Amount` - `Platform Commission`.
- Backend signature verification (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`) prevents payment tampering.
- PDF/HTML invoice generation with serial numbers (`INV-YYYY-XXXXX`), provider details, tax breakdown, and transaction references.

### 3.8 Notifications System (Module 8)
- In-app notification center for all 4 roles with unread count badges and mark-as-read capability.
- Event-triggered notifications: Booking created, provider accepted, technician dispatched, job completed, payment captured, refund processed, and admin announcements.
- Pluggable email notification adapter (SMTP) configured via environment variables.

### 3.9 Ratings, Reviews & Dispute Management (Module 9)
- Verified Purchase constraint: Only customers with a `COMPLETED` booking may post a rating (1-5 stars) and review.
- Single review per booking enforcement to prevent rating manipulation.
- Provider public response mechanism to customer reviews.
- Formal complaint escalation system: customers or providers can raise disputes with categories, supporting evidence, and resolution tracking by Admin.

### 3.10 SaaS Analytics & Reporting (Module 10)
- Super Admin Dashboard: Platform GMV, total commissions earned, booking volume trends, category market share, provider approval backlog, active users.
- Provider Dashboard: Gross revenue, platform fees, net payout balance, completion rate, customer feedback score.
- Technician Dashboard: Assigned job queue, daily schedule, weekly completion stats.
- CSV data export for bookings, revenue, and audit trails.

---

## 4. Non-Functional Requirements
- **Performance**: Sub-200ms API response time for catalog browsing and booking availability checks.
- **Security**: OWASP Top 10 compliance, strict CORS origin controls, rate-limiting on authentication endpoints, parameterized SQL queries via SQLAlchemy ORM.
- **Reliability**: ACID transactional compliance for financial payments, booking slots, and wallet balance adjustments.
- **Responsiveness**: Mobile-first design optimized for desktop, tablet, and mobile browsers (technician field operations and customer mobile booking).

