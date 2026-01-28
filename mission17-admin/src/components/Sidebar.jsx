import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target, 
  PlusCircle, // 👈 ADDED ICON
  Users, 
  BarChart3, 
  LogOut, 
  BookOpen, 
  Settings, 
  CheckCircle 
} from 'lucide-react';
import '../styles/Sidebar.css';

// IMPORT YOUR LOGO
import logoImg from '../assets/logo.png'; 

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
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
          <NavLink to="/users" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Users size={20} />
            <span>Users</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/learning" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <BookOpen size={20} />
            <span>Learning Hub</span>
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
      </ul>

      <button onClick={handleLogout} className="logout-btn">
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;