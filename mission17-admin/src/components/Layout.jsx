// src/components/Layout.jsx
import React from 'react';
import Sidebar from './Sidebar'; // Import the menu
import '../styles/Layout.css';   // Import the positioning rules

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      {/* 1. The Fixed Sidebar */}
      <Sidebar />

      {/* 2. The Page Content (Dashboard, etc.) */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;