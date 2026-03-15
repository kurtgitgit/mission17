import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target, 
  PlusCircle,
  Users, 
  BarChart3, 
  LogOut, 
  Settings, 
  CheckCircle,
  Calendar,
  Shield
} from 'lucide-react';
import '../styles/Sidebar.css';

// IMPORT YOUR LOGO
import logoImg from '../assets/logo.png'; 
import Modal from './Modal';

const Sidebar = () => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const executeLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <aside className="sidebar">
      
      {/* CLICKABLE LOGO AREA (Goes to Settings) */}
      <Link to="/settings" className="sidebar-header">
        <div className="logo-box">
          <img src={logoImg} alt="M17 Logo" className="sidebar-logo-img" />
        </div>
        <div className="logo-text-col">
          <span className="brand-name">Mission17</span>
          <span className="brand-sub">Admin Settings</span>
        </div>
      </Link>

      {/* Navigation Menu */}
      <ul className="nav-list">
        <li className="nav-item">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/missions" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Target size={20} />
            <span>Missions List</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/events" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Calendar size={20} />
            <span>Events</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/users" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Users size={20} />
            <span>Users</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/verify" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <CheckCircle size={20} />
            <span>Verify Proofs</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/analytics" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <BarChart3 size={20} />
            <span>Analytics</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/audit-logs" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Shield size={20} />
            <span>Audit Logs</span>
          </NavLink>
        </li>
      </ul>

      <button onClick={handleLogoutClick} className="logout-btn">
        <LogOut size={20} />
        <span>Logout</span>
      </button>

      <Modal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={executeLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out of the Admin Console?"
        type="danger"
        confirmText="Logout"
      />
    </aside>
  );
};

export default Sidebar;