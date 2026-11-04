# HomeServe Technologies — REST API Specification

## 1. Protocol & Conventions
- **Base URL**: `/api/v1`
- **Formats**: JSON (`application/json`)
- **Authentication**: Bearer JWT (`Authorization: Bearer <token>`)
- **Error Format**:
  ```json
  {
    "detail": "Error description or validation errors"
  }
  ```
- **Standard HTTP Codes**:
  - `200 OK`: Successful read or update.
  - `201 Created`: Resource successfully created.
  - `204 No Content`: Successful deletion.
  - `400 Bad Request`: Validation failure or business logic error.
  - `401 Unauthorized`: Missing or expired token.
  - `403 Forbidden`: Insufficient role/permissions.
  - `404 Not Found`: Resource does not exist.
  - `409 Conflict`: Concurrency conflict (e.g. double booking).
  - `422 Unprocessable Entity`: Schema validation error.
  - `500 Internal Server Error`: Unhandled server exception.

---

## 2. API Endpoints Catalog

### 2.1 Authentication & Profile (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register customer or service provider |
| `POST` | `/auth/login` | Public | Authenticate user, returns access & refresh tokens |
| `POST` | `/auth/refresh` | Public | Exchange refresh token for new access token |
| `POST` | `/auth/logout` | Authenticated | Revoke refresh token |
| `GET` | `/auth/me` | Authenticated | Fetch current authenticated user & role profile |
| `POST` | `/auth/forgot-password` | Public | Send password reset token email |
| `POST` | `/auth/reset-password` | Public | Set new password with token |
| `PUT` | `/auth/change-password` | Authenticated | Update user password |

### 2.2 Customer Management (`/api/v1/customers`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/customers/profile` | Customer | Get customer details and active addresses |
| `PUT` | `/customers/profile` | Customer | Update customer contact & preferences |
| `GET` | `/customers/addresses` | Customer | List customer addresses |
| `POST` | `/customers/addresses` | Customer | Add new address |
| `PUT` | `/customers/addresses/{id}` | Customer | Edit address |
| `DELETE`| `/customers/addresses/{id}` | Customer | Delete address |
| `GET` | `/customers/favorites` | Customer | List bookmarked providers |
| `POST` | `/customers/favorites/{provider_id}` | Customer | Toggle favorite provider |
| `GET` | `/customers/bookings` | Customer | List all bookings placed by current customer |

### 2.3 Catalog & Discovery (`/api/v1/categories`, `/api/v1/services`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/categories` | Public | List all active service categories |
| `GET` | `/categories/{slug}` | Public | Get category details with subcategories |
| `POST` | `/categories` | Admin | Create new service category |
| `PUT` | `/categories/{id}` | Admin | Update service category |
| `DELETE`| `/categories/{id}` | Admin | Soft delete / deactivate category |
| `GET` | `/services` | Public | Search & filter services (query, category, price) |
| `GET` | `/services/{id}` | Public | Get service details with providers |
| `POST` | `/services` | Admin | Create master service listing |
| `PUT` | `/services/{id}` | Admin | Update master service |

### 2.4 Service Provider Management (`/api/v1/providers`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/providers` | Public | Search verified providers by category / postal code |
| `GET` | `/providers/{id}` | Public | Public provider profile, ratings & reviews |
| `GET` | `/providers/me/dashboard` | Provider | Provider dashboard statistics & recent bookings |
| `PUT` | `/providers/me/profile` | Provider | Update business profile & bio |
| `POST` | `/providers/me/kyc` | Provider | Submit identity and business registration documents |
| `GET` | `/providers/me/services` | Provider | List custom provider service offerings |
| `POST` | `/providers/me/services` | Provider | Add or update custom service price & duration |
| `DELETE`| `/providers/me/services/{id}` | Provider | Remove service offering |
| `GET` | `/providers/me/working-hours` | Provider | Get weekly schedule |
| `PUT` | `/providers/me/working-hours` | Provider | Set weekly working hours |
| `GET` | `/providers/me/technicians` | Provider | List provider's technician fleet |
| `POST` | `/providers/me/technicians` | Provider | Create and onboard technician account |
| `GET` | `/providers/me/earnings` | Provider | View earnings, platform commissions, payouts |

### 2.5 Booking Lifecycle & Double-Booking Guard (`/api/v1/bookings`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/bookings/check-availability` | Authenticated | Validate time slot without creating booking |
| `POST` | `/bookings` | Customer | Create booking with atomic concurrency lock |
| `GET` | `/bookings/{id}` | Authenticated | View detailed booking card, status & timeline |
| `PUT` | `/bookings/{id}/provider-action` | Provider | Provider accepts or rejects booking request |
| `POST` | `/bookings/{id}/assign-technician` | Provider | Assign technician to confirmed booking |
| `PUT` | `/bookings/{id}/cancel` | Customer/Provider | Cancel booking with reason |
| `PUT` | `/bookings/{id}/reschedule` | Customer | Reschedule booking to another time slot |
| `POST` | `/bookings/{id}/images` | Authenticated | Upload reference or completion images |

### 2.6 Technician Operations (`/api/v1/technicians`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/technicians/me/jobs` | Technician | View assigned job queue |
| `GET` | `/technicians/me/jobs/{id}` | Technician | Get job details, customer address & phone |
| `PUT` | `/technicians/me/jobs/{id}/acknowledge` | Technician | Acknowledge job assignment |
| `PUT` | `/technicians/me/jobs/{id}/arrive` | Technician | Mark arrived on customer premises |
| `PUT` | `/technicians/me/jobs/{id}/start` | Technician | Mark service in progress |
| `PUT` | `/technicians/me/jobs/{id}/complete` | Technician | Mark job complete with notes & photo |

### 2.7 Payments & Invoices (`/api/v1/payments`, `/api/v1/invoices`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/payments/create-order` | Customer | Create Razorpay order or simulated order |
| `POST` | `/payments/verify` | Customer | Verify gateway signature and capture payment |
| `GET` | `/payments/{id}` | Authenticated | View payment details and receipt |
| `GET` | `/invoices/booking/{booking_id}`| Authenticated | Get tax invoice for a booking |
| `GET` | `/invoices/{id}/download` | Authenticated | Download invoice PDF / printable HTML |

### 2.8 Feedback, Reviews & Complaints (`/api/v1/reviews`, `/api/v1/complaints`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/reviews` | Customer | Submit verified review for completed booking |
| `GET` | `/reviews/provider/{provider_id}` | Public | List reviews for provider |
| `POST` | `/reviews/{id}/respond` | Provider | Submit provider response to review |
| `POST` | `/complaints` | Authenticated | File complaint dispute |
| `GET` | `/complaints` | Authenticated | View own complaints or all (Admin) |
| `PUT` | `/complaints/{id}/resolve` | Admin | Resolve complaint and record decision |

### 2.9 Notifications & Analytics (`/api/v1/notifications`, `/api/v1/analytics`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/notifications` | Authenticated | Get user notifications list & unread count |
| `PUT` | `/notifications/{id}/read` | Authenticated | Mark notification as read |
| `PUT` | `/notifications/read-all` | Authenticated | Mark all notifications as read |
| `GET` | `/analytics/admin` | Admin | System GMV, revenue, user growth, bookings |
| `GET` | `/analytics/provider` | Provider | Provider revenue, booking trends, ratings |
| `GET` | `/analytics/reports/csv` | Admin | Export bookings/revenue reports as CSV |

### 2.10 Super Admin Governance (`/api/v1/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/admin/users` | Admin | List and search all users with role filters |
| `PUT` | `/admin/users/{id}/status` | Admin | Suspend or activate user account |
| `GET` | `/admin/providers/pending` | Admin | List pending KYC provider applications |
| `PUT` | `/admin/providers/{id}/verify` | Admin | Approve or reject provider verification |
| `PUT` | `/admin/providers/{id}/commission` | Admin | Customize provider commission rate |
| `GET` | `/admin/coupons` | Admin | Manage promotional discount coupons |
| `POST` | `/admin/coupons` | Admin | Create new coupon code |
| `GET` | `/admin/audit-logs` | Admin | View system audit activity log |

