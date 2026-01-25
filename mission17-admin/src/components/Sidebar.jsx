import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Target, Users, BarChart3, LogOut, BookOpen } from 'lucide-react';
import '../styles/Layout.css';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear user session logic here
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Target size={28} />
        <span>Mission17 Admin</span>
      </div>

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
            <span>Missions</span>
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