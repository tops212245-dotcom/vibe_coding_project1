export type UserRole = 'ADMIN' | 'CUSTOMER' | 'PROVIDER' | 'TECHNICIAN';
export type UserStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED' | 'INACTIVE';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROVIDER_ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type AssignmentStatus =
  | 'ASSIGNED'
  | 'ACKNOWLEDGED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REASSIGNED';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  is_verified: boolean;
  profile_image_url?: string;
  provider_id?: number;
  technician_id?: number;
  customer_id?: number;
  business_name?: string;
  verification_status?: VerificationStatus;
}

export interface ServiceCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  subcategories?: ServiceSubcategory[];
}

export interface ServiceSubcategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
}

export interface Service {
  id: number;
  subcategory_id: number;
  name: string;
  slug: string;
  description?: string;
  base_price: number;
  estimated_duration_min: number;
  image_url?: string;
  is_active: boolean;
}

export interface ProviderSummary {
  provider_id: number;
  business_name: string;
  custom_price: number;
  duration_min: number;
  average_rating: number;
  total_reviews: number;
  experience_years: number;
  bio?: string;
  verification_status: VerificationStatus;
}

export interface Address {
  id: number;
  title: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface BookingAssignment {
  id: number;
  technician_id: number;
  technician_name: string;
  technician_phone?: string;
  status: AssignmentStatus;
  assigned_at: string;
  arrived_at?: string;
  completed_at?: string;
  completion_notes?: string;
}

export interface Booking {
  id: number;
  booking_reference: string;
  customer_id: number;
  customer_name: string;
  customer_phone?: string;
  provider_id: number;
  provider_business_name: string;
  service_id: number;
  service_name: string;
  category_name: string;
  booking_date: string;
  booking_time: string;
  estimated_duration_min: number;
  status: BookingStatus;
  problem_description?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  address_display: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  assignment?: BookingAssignment;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  booking_id: number;
  booking_reference: string;
  customer_name: string;
  provider_business_name: string;
  service_name: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_paid: number;
  issued_at: string;
}

export interface Review {
  id: number;
  booking_id: number;
  customer_name: string;
  rating: number;
  comment?: string;
  reply?: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  entity_type?: string;
  entity_id?: number;
  is_read: boolean;
  created_at: string;
}
