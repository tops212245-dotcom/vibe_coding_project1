import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { FAQPage } from './pages/public/FAQPage';
import { TermsPage } from './pages/public/TermsPage';
import { PrivacyPage } from './pages/public/PrivacyPage';
import { LoginPage } from './pages/public/LoginPage';
import { CustomerRegisterPage } from './pages/public/CustomerRegisterPage';
import { ProviderRegisterPage } from './pages/public/ProviderRegisterPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { ServicesPage } from './pages/public/ServicesPage';
import { CategoryPage } from './pages/public/CategoryPage';
import { ServiceDetailPage } from './pages/public/ServiceDetailPage';
import { ProviderListingPage } from './pages/public/ProviderListingPage';

// Customer Pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { BookingCheckoutPage } from './pages/customer/BookingCheckoutPage';
import { CustomerAddressesPage } from './pages/customer/CustomerAddressesPage';
import { CustomerBookingDetailPage } from './pages/customer/CustomerBookingDetailPage';
import { CustomerComplaintsPage } from './pages/customer/CustomerComplaintsPage';

// Provider Pages
import { ProviderDashboard } from './pages/provider/ProviderDashboard';
import { ProviderBookingRequestsPage } from './pages/provider/ProviderBookingRequestsPage';
import { ProviderServicesPage } from './pages/provider/ProviderServicesPage';
import { ProviderWorkingHoursPage } from './pages/provider/ProviderWorkingHoursPage';
import { ProviderTechniciansPage } from './pages/provider/ProviderTechniciansPage';
import { ProviderEarningsPage } from './pages/provider/ProviderEarningsPage';
import { ProviderKYCPage } from './pages/provider/ProviderKYCPage';

// Technician Pages
import { TechnicianDashboard } from './pages/technician/TechnicianDashboard';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProvidersPage } from './pages/admin/AdminProvidersPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminComplaintsPage } from './pages/admin/AdminComplaintsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/categories/:slug" element={<CategoryPage />} />
        <Route path="/services/:id" element={<ServiceDetailPage />} />
        <Route path="/providers" element={<ProviderListingPage />} />
        <Route
          path="/checkout/:serviceId"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <BookingCheckoutPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Auth Pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<CustomerRegisterPage />} />
        <Route path="/register-provider" element={<ProviderRegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Customer Dashboard */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CustomerDashboard />} />
        <Route path="addresses" element={<CustomerAddressesPage />} />
        <Route path="bookings/:id" element={<CustomerBookingDetailPage />} />
        <Route path="complaints" element={<CustomerComplaintsPage />} />
      </Route>

      {/* Provider Dashboard */}
      <Route
        path="/provider"
        element={
          <ProtectedRoute allowedRoles={['PROVIDER']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ProviderDashboard />} />
        <Route path="requests" element={<ProviderBookingRequestsPage />} />
        <Route path="services" element={<ProviderServicesPage />} />
        <Route path="schedule" element={<ProviderWorkingHoursPage />} />
        <Route path="technicians" element={<ProviderTechniciansPage />} />
        <Route path="earnings" element={<ProviderEarningsPage />} />
        <Route path="kyc" element={<ProviderKYCPage />} />
      </Route>

      {/* Technician Dashboard */}
      <Route
        path="/technician"
        element={
          <ProtectedRoute allowedRoles={['TECHNICIAN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TechnicianDashboard />} />
      </Route>

      {/* Admin Dashboard */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="providers" element={<AdminProvidersPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="complaints" element={<AdminComplaintsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;

