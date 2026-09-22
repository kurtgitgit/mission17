import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import Login from './pages/Login';
import PublicVerify from './pages/PublicVerify';
import DashboardHome from './pages/Dashboard/DashboardHome';
import Missions from './pages/Missions/Missions';
import Events from './pages/Events';
import Users from './pages/Users/Users';
import Analytics from './pages/Analytics/Analytics';
import Settings from './pages/Settings/Settings';
import Verify from './pages/Verify/Verify';
import AuditLogs from './pages/AuditLogs/AuditLogs';
import LegalPage from './pages/LegalPage';
import EssentialStorageNotice from './components/EssentialStorageNotice';

// 🏛️ New Barangay Portal Admin Pages
import Announcements from './pages/Announcements';
import Officials from './pages/Officials';
import DocumentRequests from './pages/DocumentRequests';
import BlotterManagement from './pages/BlotterManagement';
import ReportGeneration from './pages/ReportGeneration';
import Suggestions from './pages/Suggestions';

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

const getStoredSuperAdmin = () => {
  const user = getStoredPortalUser();
  return user?.role === 'super_admin' && user?.firebaseUid === auth.currentUser?.uid;
};

function RequireAdmin({ ready, isAdmin, children }) {
  if (!ready) return null;
  // This is a UI guard only; every sensitive API route remains protected by
  // backend Firebase verification and role checks.
  return (isAdmin || getStoredAdmin()) ? children : <Navigate to="/" replace />;
}

function RequireSuperAdmin({ ready, children }) {
  if (!ready) return null;
  return getStoredSuperAdmin() ? children : <Navigate to="/dashboard" replace />;
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
  const superAdminRoute = (element) => (
    <RequireSuperAdmin ready={authReady}>{element}</RequireSuperAdmin>
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
          <Route path="/missions" element={protectedRoute(<Missions />)} />
          <Route path="/events" element={protectedRoute(<Events />)} />
          <Route path="/users" element={superAdminRoute(<Users />)} />
          <Route path="/analytics" element={protectedRoute(<Analytics />)} />
          <Route path="/settings" element={protectedRoute(<Settings />)} />
          <Route path="/verify" element={protectedRoute(<Verify />)} />
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
