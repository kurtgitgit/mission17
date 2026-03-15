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
      </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;