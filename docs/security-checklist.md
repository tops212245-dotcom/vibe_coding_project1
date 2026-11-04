# HomeServe Technologies — Security & Compliance Checklist

## 1. Authentication & Session Security
- [x] **Password Hashing**: Passwords hashed with bcrypt / Argon2 with adaptive work factor and unique per-user salt.
- [x] **No Plaintext Credential Exposure**: Plaintext passwords never stored, logged, or returned in API responses.
- [x] **JWT Token Hardening**:
  - Signed using HMAC-SHA256 (`HS256`) or asymmetric `RS256` with high-entropy secret (`SECRET_KEY`).
  - Access token lifetime strictly limited (e.g. 30 minutes).
  - Refresh tokens cryptographically hashed and rotatable with immediate invalidation upon reuse or logout.
- [x] **Rate Limiting**: Authentication endpoints (`/login`, `/register`, `/forgot-password`) rate-limited to throttle brute-force credential stuffing.
- [x] **Admin Bootstrap**: Default administrator account provisioned only on initial database seed via environment variables; never hardcoded.

---

## 2. Authorization & Access Control (RBAC)
- [x] **Backend Permission Enforcement**: Never trust frontend role claims; every sensitive endpoint validates token payload against database user status and role.
- [x] **Object-Level Access Control (IDOR Protection)**:
  - Customers can only read/modify their own bookings, addresses, and complaints.
  - Providers can only view bookings and assign technicians belonging to their business.
  - Technicians can only view jobs assigned directly to their technician record.
  - Super Admin is required for user suspensions, KYC approvals, and commission changes.
- [x] **Account State Enforcement**: Suspended and inactive accounts are blocked at the middleware layer before endpoint execution.

---

## 3. Data Integrity & Concurrency
- [x] **Atomic Transactions**: Critical state mutations (e.g., booking creation, payment verification, commission ledger updates) wrapped in database transactions.
- [x] **Double-Booking Prevention**: Concurrency locks (`SELECT ... FOR UPDATE` or atomic unique slot reservation) protect against simultaneous double-booking of a single provider time slot.
- [x] **SQL Injection Defense**: 100% parameterized queries via SQLAlchemy 2.0 ORM; raw unescaped string concatenations prohibited.
- [x] **Input Validation**: Strict request payload schema validation using Pydantic v2 on backend and Zod on frontend.

---

## 4. Payment Gateway Security (Razorpay)
- [x] **Server-Side Order Generation**: Razorpay orders created exclusively via backend API; order amount strictly computed from verified database prices.
- [x] **Cryptographic Signature Verification**: Every payment callback verified using backend HMAC-SHA256 signature against `RAZORPAY_KEY_SECRET`.
- [x] **Zero Frontend Trust**: Frontend payment success callbacks treated as untrusted hints until verified and recorded server-side.
- [x] **Idempotent Webhook Processing**: Unique transaction index on `razorpay_payment_id` prevents duplicate credits or multiple invoice generations.
- [x] **Secret Isolation**: `RAZORPAY_KEY_SECRET` stored only in backend `.env`; never bundled into frontend assets.

---

## 5. File Uploads & Cloud Storage (Cloudinary)
- [x] **MIME & Extension Whitelisting**: Strict MIME-type checking (JPEG, PNG, WEBP, PDF) on backend before accepting file payloads.
- [x] **File Size Limits**: Max 5MB for profile/reference images; max 10MB for KYC legal documents.
- [x] **Direct API Access Controls**: Private KYC documents served only via authorized authenticated backend proxy or signed URLs.
- [x] **Asset Sanitization**: Cloudinary public IDs randomly generated with UUIDs to avoid enumeration attacks.

---

## 6. Network, CORS & Environment
- [x] **CORS Whitelist**: Explicit allowed origins configured in backend settings; wildcard `*` disabled in production.
- [x] **Secure Headers**: HTTP Strict Transport Security (HSTS), X-Content-Type-Options, X-Frame-Options configured for production.
- [x] **Audit Trail**: Mutating administrative actions (KYC approval/rejection, user bans, commission adjustments) recorded in `audit_logs` with actor ID, IP address, and timestamp.
