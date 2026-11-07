import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoginPage } from '@/pages/LoginPage';
import { MatchPage } from '@/pages/MatchPage';
import { MyWishlistPage } from '@/pages/MyWishlistPage';
import { RecipientWishlistPage } from '@/pages/RecipientWishlistPage';
import { AdminPage } from '@/pages/AdminPage';
import { RegistrationPage } from '@/pages/RegistrationPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a472a] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a472a] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/match" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { wishlistEnabled } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegistrationPage />
          </PublicRoute>
        }
      />
      <Route
        path="/match"
        element={
          <ProtectedRoute>
            <MatchPage />
          </ProtectedRoute>
        }
      />
      {wishlistEnabled ? (
        <>
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <MyWishlistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipient"
            element={
              <ProtectedRoute>
                <RecipientWishlistPage />
              </ProtectedRoute>
            }
          />
        </>
      ) : (
        <>
          <Route path="/wishlist" element={<Navigate to="/match" replace />} />
          <Route path="/recipient" element={<Navigate to="/match" replace />} />
        </>
      )}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/match" replace />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

import { SnowOverlay } from '@/components/ui/SnowOverlay';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SnowOverlay />
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#faf8f5',
              color: '#1a472a',
              border: '1px solid #e5e0d8',
            },
            className: 'sonner-toast',
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
