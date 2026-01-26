import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardHome from './pages/Dashboard/DashboardHome';
import Missions from './pages/Missions/Missions';
import AddMission from './pages/Missions/AddMission'; // 👈 NEW IMPORT
import Users from './pages/Users/Users';
import Analytics from './pages/Analytics/Analytics';
import Learning from './pages/Learning/Learning';
import Settings from './pages/Settings/Settings';
import Verify from './pages/Verify/Verify';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Admin Routes */}
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="/add-mission" element={<AddMission />} /> {/* 👈 NEW ROUTE */}
        <Route path="/users" element={<Users />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/learning" element={<Learning />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/verify" element={<Verify />} />
      </Routes>
    </Router>
  );
}

export default App;