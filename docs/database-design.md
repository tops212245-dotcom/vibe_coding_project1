# HomeServe Technologies — Database Design & Schema Specification

## 1. Relational Design Principles
- **Engine**: MySQL 8.0+ InnoDB (supporting ACID transactions and foreign key enforcement). Full compatibility with SQLite for development and testing.
- **Character Set & Collation**: `utf8mb4` with `utf8mb4_unicode_ci` for universal multilingual support.
- **Normalization**: 3rd Normal Form (3NF) to eliminate data redundancy while maintaining targeted denormalization (e.g. historical snapshot prices on bookings and invoices to protect against catalog price changes).
- **Auditability**: Every table includes `created_at` and `updated_at` timestamps using UTC.
- **Soft Deletion**: Sensitive operational entities (`users`, `services`, `bookings`) support `is_active` or `deleted_at` fields where appropriate.

---

## 2. Comprehensive Entity Data Dictionary

### Group A: Identity & Profiles
1. **`users`**: Base authentication table for all 4 roles.
   - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
   - `email`: VARCHAR(255) UNIQUE NOT NULL (indexed)
   - `hashed_password`: VARCHAR(255) NOT NULL
   - `role`: ENUM('ADMIN', 'CUSTOMER', 'PROVIDER', 'TECHNICIAN') NOT NULL
   - `first_name`: VARCHAR(100) NOT NULL
   - `last_name`: VARCHAR(100) NOT NULL
   - `phone`: VARCHAR(30) NULL
   - `profile_image_url`: VARCHAR(500) NULL
   - `status`: ENUM('ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'INACTIVE') DEFAULT 'ACTIVE'
   - `is_verified`: BOOLEAN DEFAULT FALSE
   - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
   - `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

2. **`customers`**: Extended profile for customers.
   - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
   - `user_id`: INT UNSIGNED UNIQUE NOT NULL (FK -> users.id, ON DELETE CASCADE)
   - `default_address_id`: INT UNSIGNED NULL
   - `preferences`: JSON NULL
   - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
   - `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

3. **`service_providers`**: Business and KYC profile for vendors.
   - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
   - `user_id`: INT UNSIGNED UNIQUE NOT NULL (FK -> users.id, ON DELETE CASCADE)
   - `business_name`: VARCHAR(255) NOT NULL
   - `business_reg_no`: VARCHAR(100) NULL
   - `tax_id`: VARCHAR(100) NULL
   - `bio`: TEXT NULL
   - `experience_years`: INT DEFAULT 0
   - `verification_status`: ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED') DEFAULT 'PENDING'
   - `verification_notes`: TEXT NULL
   - `id_proof_url`: VARCHAR(500) NULL
   - `business_proof_url`: VARCHAR(500) NULL
   - `average_rating`: DECIMAL(3, 2) DEFAULT 0.00
   - `total_reviews`: INT DEFAULT 0
   - `commission_rate`: DECIMAL(5, 2) DEFAULT 10.00
   - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
   - `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

4. **`technicians`**: Field workforce linked to a provider.
   - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
   - `user_id`: INT UNSIGNED UNIQUE NOT NULL (FK -> users.id, ON DELETE CASCADE)
   - `provider_id`: INT UNSIGNED NOT NULL (FK -> service_providers.id, ON DELETE CASCADE)
   - `specialization`: VARCHAR(255) NULL
   - `is_available`: BOOLEAN DEFAULT TRUE
   - `rating`: DECIMAL(3, 2) DEFAULT 5.00
   - `total_jobs`: INT DEFAULT 0
   - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
   - `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

5. **`addresses`**: Reusable multi-address book for customers.
   - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
   - `user_id`: INT UNSIGNED NOT NULL (FK -> users.id, ON DELETE CASCADE)
   - `title`: VARCHAR(100) NOT NULL (e.g., "Home", "Office")
   - `address_line1`: VARCHAR(255) NOT NULL
   - `address_line2`: VARCHAR(255) NULL
   - `city`: VARCHAR(100) NOT NULL
   - `state`: VARCHAR(100) NOT NULL
   - `postal_code`: VARCHAR(20) NOT NULL
   - `country`: VARCHAR(100) DEFAULT 'India'
   - `latitude`: DECIMAL(10, 8) NULL
   - `longitude`: DECIMAL(11, 8) NULL
   - `is_default`: BOOLEAN DEFAULT FALSE
   - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### Group B: Service Catalog & Coverage
6. **`service_categories`**: Master service categories (Electrical, Plumbing, etc.).
   - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
   - `name`: VARCHAR(100) UNIQUE NOT NULL
   - `slug`: VARCHAR(120) UNIQUE NOT NULL
   - `description`: TEXT NULL
   - `icon`: VARCHAR(100) NULL
   - `image_url`: VARCHAR(500) NULL
   - `is_active`: BOOLEAN DEFAULT TRUE
   - `sort_order`: INT DEFAULT 0
   - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

7. **`service_subcategories`**: Sub-specializations under categories.
   - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
   - `category_id`: INT UNSIGNED NOT NULL (FK -> service_categories.id, ON DELETE CASCADE)
   - `name`: VARCHAR(100) NOT NULL
   - `slug`: VARCHAR(120) UNIQUE NOT NULL
   - `description`: TEXT NULL
   - `is_active`: BOOLEAN DEFAULT TRUE
   - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

8. **`services`**: Master service templates.
   - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
   - `subcategory_id`: INT UNSIGNED NOT NULL (FK -> service_subcategories.id, ON DELETE CASCADE)
   - `name`: VARCHAR(200) NOT NULL
   - `slug`: VARCHAR(220) UNIQUE NOT NULL
   - `description`: TEXT NULL
   - `base_price`: DECIMAL(10, 2) NOT NULL
   - `estimated_duration_min`: INT NOT NULL DEFAULT 60
   - `image_url`: VARCHAR(500) NULL
   - `is_active`: BOOLEAN DEFAULT TRUE
   - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

9. **`provider_services`**: Provider-specific customized offerings of a service.
   - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
   - `provider_id`: INT UNSIGNED NOT NULL (FK -> service_providers.id, ON DELETE CASCADE)
   - `service_id`: INT UNSIGNED NOT NULL (FK -> services.id, ON DELETE CASCADE)
   - `custom_price`: DECIMAL(10, 2) NOT NULL
   - `duration_min`: INT NOT NULL
   - `is_available`: BOOLEAN DEFAULT TRUE
   - `description`: TEXT NULL
   - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
   - UNIQUE KEY `uk_provider_service` (`provider_id`, `service_id`)

10. **`service_areas`**: Geographical zip codes / zones served by a provider.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `provider_id`: INT UNSIGNED NOT NULL (FK -> service_providers.id, ON DELETE CASCADE)
    - `postal_code`: VARCHAR(20) NOT NULL
    - `city`: VARCHAR(100) NOT NULL
    - `is_active`: BOOLEAN DEFAULT TRUE
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
    - INDEX `idx_postal_city` (`postal_code`, `city`)

### Group C: Schedules & Availability
11. **`provider_working_hours`**: Operating schedule per day of week.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `provider_id`: INT UNSIGNED NOT NULL (FK -> service_providers.id, ON DELETE CASCADE)
    - `day_of_week`: TINYINT NOT NULL (0=Monday, 6=Sunday)
    - `start_time`: TIME NOT NULL
    - `end_time`: TIME NOT NULL
    - `is_closed`: BOOLEAN DEFAULT FALSE
    - UNIQUE KEY `uk_provider_day` (`provider_id`, `day_of_week`)

12. **`availability_slots`**: Pre-generated or bookable time intervals.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `provider_id`: INT UNSIGNED NOT NULL (FK -> service_providers.id, ON DELETE CASCADE)
    - `slot_date`: DATE NOT NULL
    - `start_time`: TIME NOT NULL
    - `end_time`: TIME NOT NULL
    - `is_booked`: BOOLEAN DEFAULT FALSE
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
    - UNIQUE KEY `uk_provider_slot` (`provider_id`, `slot_date`, `start_time`)

### Group D: Bookings & Field Dispatch
13. **`bookings`**: Central transaction entity.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `booking_reference`: VARCHAR(32) UNIQUE NOT NULL
    - `customer_id`: INT UNSIGNED NOT NULL (FK -> customers.id)
    - `provider_id`: INT UNSIGNED NOT NULL (FK -> service_providers.id)
    - `service_id`: INT UNSIGNED NOT NULL (FK -> services.id)
    - `address_id`: INT UNSIGNED NOT NULL (FK -> addresses.id)
    - `booking_date`: DATE NOT NULL
    - `booking_time`: TIME NOT NULL
    - `estimated_duration_min`: INT NOT NULL DEFAULT 60
    - `status`: ENUM('PENDING', 'CONFIRMED', 'PROVIDER_ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED') DEFAULT 'PENDING'
    - `problem_description`: TEXT NULL
    - `subtotal`: DECIMAL(10, 2) NOT NULL
    - `discount`: DECIMAL(10, 2) DEFAULT 0.00
    - `tax`: DECIMAL(10, 2) DEFAULT 0.00
    - `total_amount`: DECIMAL(10, 2) NOT NULL
    - `cancellation_reason`: TEXT NULL
    - `rescheduled_from_id`: INT UNSIGNED NULL
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
    - `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    - INDEX `idx_provider_date_status` (`provider_id`, `booking_date`, `status`)

14. **`booking_assignments`**: Assigning a technician to a booking.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `booking_id`: INT UNSIGNED NOT NULL (FK -> bookings.id, ON DELETE CASCADE)
    - `technician_id`: INT UNSIGNED NOT NULL (FK -> technicians.id)
    - `assigned_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
    - `acknowledged_at`: DATETIME NULL
    - `arrived_at`: DATETIME NULL
    - `completed_at`: DATETIME NULL
    - `status`: ENUM('ASSIGNED', 'ACKNOWLEDGED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'REASSIGNED') DEFAULT 'ASSIGNED'
    - `completion_notes`: TEXT NULL

15. **`booking_status_history`**: Audit trail of every booking transition.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `booking_id`: INT UNSIGNED NOT NULL (FK -> bookings.id, ON DELETE CASCADE)
    - `previous_status`: VARCHAR(50) NULL
    - `new_status`: VARCHAR(50) NOT NULL
    - `changed_by_user_id`: INT UNSIGNED NOT NULL (FK -> users.id)
    - `remarks`: TEXT NULL
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

16. **`booking_images`**: Images attached to a booking (customer reference, before/after).
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `booking_id`: INT UNSIGNED NOT NULL (FK -> bookings.id, ON DELETE CASCADE)
    - `image_type`: ENUM('CUSTOMER_REFERENCE', 'BEFORE_SERVICE', 'AFTER_SERVICE') NOT NULL
    - `image_url`: VARCHAR(500) NOT NULL
    - `caption`: VARCHAR(255) NULL
    - `uploaded_by_user_id`: INT UNSIGNED NOT NULL (FK -> users.id)
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### Group E: Payments, Invoices & Commissions
17. **`payments`**: High-level payment order record.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `booking_id`: INT UNSIGNED UNIQUE NOT NULL (FK -> bookings.id)
    - `razorpay_order_id`: VARCHAR(100) UNIQUE NULL
    - `amount`: DECIMAL(10, 2) NOT NULL
    - `currency`: VARCHAR(10) DEFAULT 'INR'
    - `status`: ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') DEFAULT 'PENDING'
    - `payment_method`: VARCHAR(50) NULL (e.g., 'RAZORPAY', 'SIMULATED', 'CASH')
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
    - `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

18. **`payment_transactions`**: Individual payment attempts & gateway callbacks.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `payment_id`: INT UNSIGNED NOT NULL (FK -> payments.id, ON DELETE CASCADE)
    - `razorpay_payment_id`: VARCHAR(100) UNIQUE NULL
    - `razorpay_signature`: VARCHAR(255) NULL
    - `status`: VARCHAR(50) NOT NULL
    - `gateway_response`: JSON NULL
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

19. **`invoices`**: Formal financial tax invoice for completed services.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `invoice_number`: VARCHAR(50) UNIQUE NOT NULL (e.g., "INV-2026-0001")
    - `booking_id`: INT UNSIGNED UNIQUE NOT NULL (FK -> bookings.id)
    - `payment_id`: INT UNSIGNED NOT NULL (FK -> payments.id)
    - `customer_name`: VARCHAR(200) NOT NULL
    - `provider_business_name`: VARCHAR(255) NOT NULL
    - `service_name`: VARCHAR(200) NOT NULL
    - `subtotal`: DECIMAL(10, 2) NOT NULL
    - `discount_amount`: DECIMAL(10, 2) DEFAULT 0.00
    - `tax_amount`: DECIMAL(10, 2) DEFAULT 0.00
    - `total_paid`: DECIMAL(10, 2) NOT NULL
    - `issued_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

20. **`coupons`**: Promotional discount codes.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `code`: VARCHAR(50) UNIQUE NOT NULL
    - `discount_type`: ENUM('PERCENTAGE', 'FIXED') NOT NULL
    - `discount_value`: DECIMAL(10, 2) NOT NULL
    - `min_order_amount`: DECIMAL(10, 2) DEFAULT 0.00
    - `max_discount_amount`: DECIMAL(10, 2) NULL
    - `valid_from`: DATETIME NOT NULL
    - `valid_until`: DATETIME NOT NULL
    - `usage_limit`: INT DEFAULT 100
    - `times_used`: INT DEFAULT 0
    - `is_active`: BOOLEAN DEFAULT TRUE
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

21. **`coupon_usages`**: User consumption tracker for coupons.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `coupon_id`: INT UNSIGNED NOT NULL (FK -> coupons.id)
    - `customer_id`: INT UNSIGNED NOT NULL (FK -> customers.id)
    - `booking_id`: INT UNSIGNED UNIQUE NOT NULL (FK -> bookings.id)
    - `discount_applied`: DECIMAL(10, 2) NOT NULL
    - `used_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

22. **`provider_earnings`**: Accounting record per completed booking.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `provider_id`: INT UNSIGNED NOT NULL (FK -> service_providers.id)
    - `booking_id`: INT UNSIGNED UNIQUE NOT NULL (FK -> bookings.id)
    - `gross_amount`: DECIMAL(10, 2) NOT NULL
    - `platform_commission`: DECIMAL(10, 2) NOT NULL
    - `net_earning`: DECIMAL(10, 2) NOT NULL
    - `is_paid_out`: BOOLEAN DEFAULT FALSE
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

23. **`provider_payouts`**: Bank settlement transfer batches.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `provider_id`: INT UNSIGNED NOT NULL (FK -> service_providers.id)
    - `amount`: DECIMAL(10, 2) NOT NULL
    - `status`: ENUM('PENDING', 'PROCESSING', 'PAID', 'FAILED') DEFAULT 'PENDING'
    - `transaction_reference`: VARCHAR(100) NULL
    - `processed_at`: DATETIME NULL
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### Group F: Feedback, Disputes & Subscriptions
24. **`reviews`**: Ratings and reviews submitted by customers.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `booking_id`: INT UNSIGNED UNIQUE NOT NULL (FK -> bookings.id)
    - `customer_id`: INT UNSIGNED NOT NULL (FK -> customers.id)
    - `provider_id`: INT UNSIGNED NOT NULL (FK -> service_providers.id)
    - `rating`: TINYINT NOT NULL (1 to 5)
    - `comment`: TEXT NULL
    - `is_verified`: BOOLEAN DEFAULT TRUE
    - `is_visible`: BOOLEAN DEFAULT TRUE
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

25. **`review_responses`**: Provider public response to a customer review.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `review_id`: INT UNSIGNED UNIQUE NOT NULL (FK -> reviews.id, ON DELETE CASCADE)
    - `provider_id`: INT UNSIGNED NOT NULL (FK -> service_providers.id)
    - `response_text`: TEXT NOT NULL
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

26. **`complaints`**: Dispute tickets.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `ticket_number`: VARCHAR(50) UNIQUE NOT NULL (e.g. "CMP-2026-0001")
    - `booking_id`: INT UNSIGNED NOT NULL (FK -> bookings.id)
    - `user_id`: INT UNSIGNED NOT NULL (FK -> users.id)
    - `category`: VARCHAR(100) NOT NULL
    - `description`: TEXT NOT NULL
    - `status`: ENUM('OPEN', 'IN_INVESTIGATION', 'RESOLVED', 'REJECTED') DEFAULT 'OPEN'
    - `admin_resolution`: TEXT NULL
    - `resolved_by_user_id`: INT UNSIGNED NULL (FK -> users.id)
    - `resolved_at`: DATETIME NULL
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

27. **`favorites`**: Customer favorite bookmarks for providers.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `customer_id`: INT UNSIGNED NOT NULL (FK -> customers.id, ON DELETE CASCADE)
    - `provider_id`: INT UNSIGNED NOT NULL (FK -> service_providers.id, ON DELETE CASCADE)
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
    - UNIQUE KEY `uk_customer_provider_fav` (`customer_id`, `provider_id`)

28. **`subscription_plans`**: SaaS tier packages for service providers.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `name`: VARCHAR(100) NOT NULL
    - `price`: DECIMAL(10, 2) NOT NULL
    - `duration_days`: INT NOT NULL DEFAULT 30
    - `commission_rate`: DECIMAL(5, 2) NOT NULL
    - `max_technicians`: INT DEFAULT 5
    - `features`: JSON NULL
    - `is_active`: BOOLEAN DEFAULT TRUE
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

29. **`provider_subscriptions`**: Provider active subscription tier.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `provider_id`: INT UNSIGNED NOT NULL (FK -> service_providers.id)
    - `plan_id`: INT UNSIGNED NOT NULL (FK -> subscription_plans.id)
    - `start_date`: DATETIME NOT NULL
    - `end_date`: DATETIME NOT NULL
    - `status`: ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE'
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### Group G: Security, Tokens & Audit
30. **`notifications`**: In-app notifications for users.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `user_id`: INT UNSIGNED NOT NULL (FK -> users.id, ON DELETE CASCADE)
    - `title`: VARCHAR(255) NOT NULL
    - `message`: TEXT NOT NULL
    - `type`: VARCHAR(50) DEFAULT 'INFO'
    - `entity_type`: VARCHAR(50) NULL (e.g. 'BOOKING', 'PAYMENT')
    - `entity_id`: INT UNSIGNED NULL
    - `is_read`: BOOLEAN DEFAULT FALSE
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

31. **`audit_logs`**: System security activity trail.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `user_id`: INT UNSIGNED NULL (FK -> users.id)
    - `action`: VARCHAR(100) NOT NULL
    - `ip_address`: VARCHAR(45) NULL
    - `user_agent`: VARCHAR(255) NULL
    - `details`: JSON NULL
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

32. **`password_reset_tokens`**: Time-limited password reset tokens.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `user_id`: INT UNSIGNED NOT NULL (FK -> users.id, ON DELETE CASCADE)
    - `token_hash`: VARCHAR(255) NOT NULL
    - `expires_at`: DATETIME NOT NULL
    - `is_used`: BOOLEAN DEFAULT FALSE
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

33. **`refresh_tokens`**: Rotating JWT refresh tokens.
    - `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    - `user_id`: INT UNSIGNED NOT NULL (FK -> users.id, ON DELETE CASCADE)
    - `token_hash`: VARCHAR(255) NOT NULL
    - `expires_at`: DATETIME NOT NULL
    - `is_revoked`: BOOLEAN DEFAULT FALSE
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

