import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target, 
  Users, 
  BarChart3, 
  LogOut, 
  Settings, 
  Calendar, 
  Shield, 
  Megaphone, 
  FileText, 
  Printer, 
  Lightbulb, 
  UserCheck, 
  ShieldAlert, 
  FileCheck,
  ChevronDown,
  Layers,
  Folder,
  Briefcase
} from 'lucide-react';
import '../styles/Sidebar.css';
import Modal from './Modal';
import logoImg from '../assets/logo.png';

const MENU_GROUPS = [
  {
    id: 'hub',
    label: 'Overview & Hub',
    icon: Layers,
    items: [
      { to: '/dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
      { to: '/analytics', label: 'Civic Analytics', icon: BarChart3 },
      { to: '/report-generation', label: 'Report Generation', icon: Printer },
    ]
  },
  {
    id: 'services',
    label: 'Barangay Services',
    icon: Briefcase,
    items: [
      { to: '/document-requests', label: 'Document Requests', icon: FileText },
      { to: '/blotter-reports', label: 'Blotter & Peacekeeping', icon: ShieldAlert },
      { to: '/suggestions', label: 'Citizen Feedback Desk', icon: Lightbulb },
      { to: '/announcements', label: 'Bulletins & Alerts', icon: Megaphone },
    ]
  },
  {
    id: 'community',
    label: 'Community & Civic',
    icon: Folder,
    items: [
      { to: '/officials', label: 'Barangay Council', icon: UserCheck },
      { to: '/events', label: 'Barangay Events', icon: Calendar },
      { to: '/missions', label: 'Civic Tasks & Programs', icon: Target },
      { to: '/verify', label: 'Proof Verifications', icon: FileCheck },
    ]
  },
  {
    id: 'system',
    label: 'System & Records',
    icon: Settings,
    items: [
      { to: '/users', label: 'Resident Directory', icon: Users },
      { to: '/audit-logs', label: 'Audit Trail & Security', icon: Shield },
      { to: '/settings', label: 'Portal Settings', icon: Settings },
    ]
  }
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Determine which group contains the active route to open by default
  const activeGroupId = MENU_GROUPS.find(group => 
    group.items.some(item => location.pathname.startsWith(item.to))
  )?.id || 'hub';

  const [openGroups, setOpenGroups] = useState({
    hub: true,
    services: true,
    community: false,
    system: false,
    [activeGroupId]: true
  });

  useEffect(() => {
    if (activeGroupId) {
      setOpenGroups(prev => ({ ...prev, [activeGroupId]: true }));
    }
  }, [location.pathname]);

  const toggleGroup = (id) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const executeLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <aside className="sidebar">
      
      {/* BRGY LOGO AREA */}
      <Link to="/settings" className="sidebar-header">
        <div className="logo-box brgy-logo-box">
          <img src={logoImg} alt="BrgyLink Logo" className="sidebar-logo-img" />
        </div>
        <div className="logo-text-col">
          <span className="brand-name">Brgy. Bagong Pag-asa</span>
          <span className="brand-sub">Executive eGov Portal</span>
        </div>
      </Link>

      {/* Navigation Menu (Interactive Collapsible Groups) */}
      <div className="nav-accordion-container">
        {MENU_GROUPS.map(group => {
          const GroupIcon = group.icon;
          const isOpen = openGroups[group.id];
          const hasActiveChild = group.items.some(item => location.pathname === item.to);

          return (
            <div key={group.id} className={`nav-group-block ${hasActiveChild ? 'has-active' : ''}`}>
              {/* GROUP ACCORDION HEADER */}
              <button
                type="button"
                className={`nav-group-header ${isOpen ? 'open' : ''} ${hasActiveChild ? 'active-group' : ''}`}
                onClick={() => toggleGroup(group.id)}
              >
                <div className="nav-group-header-left">
                  <GroupIcon size={19} className="nav-group-icon" />
                  <span className="nav-group-title">{group.label}</span>
                </div>
                <div className="nav-group-header-right">
                  <ChevronDown 
                    size={16} 
                    className={`nav-chevron ${isOpen ? 'rotated' : ''}`}
                  />
                </div>

              </button>

              {/* COLLAPSIBLE SUB-MENU */}
              {isOpen && (
                <ul className="nav-sub-list">
                  {group.items.map(item => {
                    const ItemIcon = item.icon;
                    return (
                      <li key={item.to} className="nav-sub-item">
                        <NavLink
                          to={item.to}
                          className={({ isActive }) => isActive ? "nav-sub-link active" : "nav-sub-link"}
                        >
                          <ItemIcon size={16} />
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              )}

            </div>
          );
        })}
      </div>

      {/* LOGOUT BUTTON */}
      <button onClick={() => setShowLogoutConfirm(true)} className="logout-btn">
        <LogOut size={16} />
        <span>Logout</span>
      </button>

      <Modal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={executeLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out of the Barangay Bagong Pag-asa Admin Portal?"
        type="danger"
        confirmText="Logout"
      />
    </aside>
  );
};

export default Sidebar;


