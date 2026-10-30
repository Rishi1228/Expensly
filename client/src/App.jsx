import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import AuthProvider from './context/AuthProvider.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ProtectedRoute, PublicOnlyRoute } from './components/layout/RouteGuards.jsx';
import { FullPageSpinner } from './components/ui/Spinner.jsx';
import { useTheme } from './lib/theme.js';
import AuthPage from './pages/AuthPage.jsx';

// Each page is its own chunk, so e.g. the chart library loads only with the dashboard.
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage.jsx'));
const RecurringPage = lazy(() => import('./pages/RecurringPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage.jsx'));
const FamilyPage = lazy(() => import('./pages/FamilyPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, err) => err.status >= 500 && count < 2,
    },
  },
});

export default function App() {
  const [, , isDark] = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<FullPageSpinner />}>
              <Routes>
                <Route element={<PublicOnlyRoute />}>
                  <Route path="/login" element={<AuthPage key="login" mode="login" />} />
                  <Route path="/signup" element={<AuthPage key="signup" mode="signup" />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                </Route>
                {/* The reset link signs the user in, so this page sits outside the guards */}
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="expenses" element={<ExpensesPage />} />
                    <Route path="recurring" element={<RecurringPage />} />
                    <Route path="family" element={<FamilyPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="categories" element={<CategoriesPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
        <Toaster richColors position="top-center" theme={isDark ? 'dark' : 'light'} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
