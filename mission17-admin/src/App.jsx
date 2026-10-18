import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import Login from './pages/Login';
import PublicVerify from './pages/PublicVerify';
import LegalPage from './pages/LegalPage';
import EssentialStorageNotice from './components/EssentialStorageNotice';

// Keep the login/public shell small; load protected admin screens only when visited.
const DashboardHome = React.lazy(() => import('./pages/Dashboard/DashboardHome'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Users = React.lazy(() => import('./pages/Users/Users'));
const Settings = React.lazy(() => import('./pages/Settings/Settings'));
const AuditLogs = React.lazy(() => import('./pages/AuditLogs/AuditLogs'));
const Announcements = React.lazy(() => import('./pages/Announcements'));
const Officials = React.lazy(() => import('./pages/Officials'));
const DocumentRequests = React.lazy(() => import('./pages/DocumentRequests'));
const BlotterManagement = React.lazy(() => import('./pages/BlotterManagement'));
const ReportGeneration = React.lazy(() => import('./pages/ReportGeneration'));
const Suggestions = React.lazy(() => import('./pages/Suggestions'));

import { NotificationProvider } from './context/NotificationContext';

const getStoredPortalUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const getStoredAdmin = () => {
  const user = getStoredPortalUser();
  return ['admin', 'super_admin'].includes(user?.role) && user?.firebaseUid === auth.currentUser?.uid;
};

function RequireAdmin({ ready, isAdmin, children }) {
  if (!ready) return null;
  // This is a UI guard only; every sensitive API route remains protected by
  // backend Firebase verification and role checks.
  return (isAdmin || getStoredAdmin()) ? (
    <LazyRouteBoundary>
      <React.Suspense
        fallback={
          <div
            role="status"
            aria-live="polite"
            style={{
              minHeight: '40vh',
              display: 'grid',
              placeItems: 'center',
              padding: '2rem',
              color: '#64748b',
            }}
          >
            Loading portal section…
          </div>
        }
      >
        {children}
      </React.Suspense>
    </LazyRouteBoundary>
  ) : <Navigate to="/" replace />;
}

class LazyRouteBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" style={{ padding: '2rem', color: '#7f1d1d' }}>
          <p>This portal section could not be loaded. Check your connection and reload the page.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // 🔄 Auto-refresh Firebase ID token to prevent token expiration 400/401 errors
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          const freshToken = await user.getIdToken();
          localStorage.setItem('token', freshToken);
          setIsAdmin(getStoredAdmin());
        } catch (e) {
          console.error("Token auto-refresh error:", e);
          setIsAdmin(false);
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAdmin(false);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const protectedRoute = (element) => (
    <RequireAdmin ready={authReady} isAdmin={isAdmin}>{element}</RequireAdmin>
  );
  return (

    <NotificationProvider>
      <Router>
        <EssentialStorageNotice />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          {/* Admin accounts are provisioned only by an authorized Super Admin. */}
          <Route path="/signup" element={<Navigate to="/" replace />} />
          <Route path="/public-verify" element={<PublicVerify />} />
          <Route path="/privacy" element={<LegalPage type="privacy" />} />
          <Route path="/terms" element={<LegalPage type="terms" />} />
          <Route path="/accessibility" element={<LegalPage type="accessibility" />} />
          <Route path="/ai-disclosure" element={<LegalPage type="ai" />} />
          <Route path="/browser-storage" element={<LegalPage type="storage" />} />
          
          {/* Protected Admin Routes */}
          <Route path="/dashboard" element={protectedRoute(<DashboardHome />)} />
          <Route path="/analytics" element={protectedRoute(<Analytics />)} />
          <Route path="/users" element={protectedRoute(<Users />)} />
          <Route path="/settings" element={protectedRoute(<Settings />)} />
          <Route path="/audit-logs" element={protectedRoute(<AuditLogs />)} />

          {/* 🏛️ Barangay Portal Routes */}
          <Route path="/announcements" element={protectedRoute(<Announcements />)} />
          <Route path="/officials" element={protectedRoute(<Officials />)} />
          <Route path="/document-requests" element={protectedRoute(<DocumentRequests />)} />
          <Route path="/blotter-reports" element={protectedRoute(<BlotterManagement />)} />
          <Route path="/report-generation" element={protectedRoute(<ReportGeneration />)} />
          <Route path="/suggestions" element={protectedRoute(<Suggestions />)} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;
