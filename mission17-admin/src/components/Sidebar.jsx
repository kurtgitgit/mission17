import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target, 
  Users, 
  BarChart3, 
  LogOut, 
  Settings, 
  CheckCircle,
  Calendar,
  Shield,
  Megaphone,
  FileText,
  Printer,
  Lightbulb,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import '../styles/Sidebar.css';
import Modal from './Modal';

const Sidebar = () => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const executeLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <aside className="sidebar">
      
      {/* BRGY LOGO AREA */}
      <Link to="/settings" className="sidebar-header">
        <div className="logo-box brgy-logo-box" style={{ background: '#FCD116' }}>
          <span className="brgy-logo-emoji">🇵🇭</span>
        </div>
        <div className="logo-text-col">
          <span className="brand-name">Brgy. Pantal</span>
          <span className="brand-sub">eGov Portal</span>
        </div>
      </Link>

      {/* Navigation Menu */}
      <ul className="nav-list">

        <li className="nav-section-label">OVERVIEW</li>
        <li className="nav-item">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/analytics" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <BarChart3 size={20} />
            <span>Analytics</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/report-generation" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Printer size={20} />
            <span>Report Generation</span>
          </NavLink>
        </li>

        <li className="nav-section-label">BARANGAY MANAGEMENT</li>
        <li className="nav-item">
          <NavLink to="/announcements" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Megaphone size={20} />
            <span>Announcements</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/document-requests" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <FileText size={20} />
            <span>Document Requests</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/blotter-reports" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <ShieldAlert size={20} />
            <span>Blotter Reports</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/suggestions" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Lightbulb size={20} />
            <span>Community Feedback</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/officials" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <UserCheck size={20} />
            <span>Officials</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/events" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Calendar size={20} />
            <span>Events</span>
          </NavLink>
        </li>

        <li className="nav-section-label">CIVIC PROGRAMS</li>
        <li className="nav-item">
          <NavLink to="/missions" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Target size={20} />
            <span>Civic Tasks</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/verify" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <CheckCircle size={20} />
            <span>Verify Proofs</span>
          </NavLink>
        </li>

        <li className="nav-section-label">RESIDENTS</li>
        <li className="nav-item">
          <NavLink to="/users" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Users size={20} />
            <span>Residents</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/audit-logs" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Shield size={20} />
            <span>Audit Logs</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/settings" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </li>

      </ul>

      <button onClick={() => setShowLogoutConfirm(true)} className="logout-btn">
        <LogOut size={20} />
        <span>Logout</span>
      </button>

      <Modal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={executeLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out of the Barangay Pantal Admin Portal?"
        type="danger"
        confirmText="Logout"
      />
    </aside>
  );
};

export default Sidebar;
