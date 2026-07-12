import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoutes';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Organization from './pages/Organization';
import Departments from './pages/Departments';
import Employees from './pages/Employees';
import Categories from './pages/Categories';
import Assets from './pages/Assets';
import RegisterAsset from './pages/RegisterAsset';
import AssetDetails from './pages/AssetDetails';
import Transfers from './pages/Transfers';
import Bookings from './pages/Bookings';
import Maintenance from './pages/Maintenance';
import Audits from './pages/Audits';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/assets/:id" element={<AssetDetails />} />
                <Route path="/transfers" element={<Transfers />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/audits" element={<Audits />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Notifications />} />
              </Route>

              {/* Gated Routes (Role based permissions) */}
              <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                <Route path="/organization" element={<Organization />} />
                <Route path="/employees" element={<Employees />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['Admin', 'Asset Manager']} />}>
                <Route path="/categories" element={<Categories />} />
                <Route path="/assets/register" element={<RegisterAsset />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['Admin', 'Asset Manager', 'Department Head']} />}>
                <Route path="/departments" element={<Departments />} />
                <Route path="/reports" element={<Reports />} />
              </Route>

              {/* 404 Routing fallback */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
            
            {/* Custom styled toast alerts */}
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 border text-xs font-semibold rounded-xl p-3.5',
                duration: 4000,
              }}
            />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
