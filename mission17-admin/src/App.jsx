import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardHome from './pages/Dashboard/DashboardHome';
import Missions from './pages/Missions/Missions';
import Events from './pages/Events';
import Users from './pages/Users/Users';
import Analytics from './pages/Analytics/Analytics';
import Settings from './pages/Settings/Settings';
import Verify from './pages/Verify/Verify';
import AuditLogs from './pages/AuditLogs/AuditLogs';

// 🏛️ New Barangay Portal Admin Pages
import Announcements from './pages/Announcements';
import Officials from './pages/Officials';
import DocumentRequests from './pages/DocumentRequests';
import BlotterManagement from './pages/BlotterManagement';
import ReportGeneration from './pages/ReportGeneration';
import Suggestions from './pages/Suggestions';

import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected Admin Routes */}
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/missions" element={<Missions />} />
          <Route path="/events" element={<Events />} />
          <Route path="/users" element={<Users />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/audit-logs" element={<AuditLogs />} />

          {/* 🏛️ Barangay Portal Routes */}
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/officials" element={<Officials />} />
          <Route path="/document-requests" element={<DocumentRequests />} />
          <Route path="/blotter-reports" element={<BlotterManagement />} />
          <Route path="/report-generation" element={<ReportGeneration />} />
          <Route path="/suggestions" element={<Suggestions />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;
