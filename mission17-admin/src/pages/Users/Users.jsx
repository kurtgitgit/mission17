import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout'; // Keep your existing path
import '../../styles/Users.css'; // Keep your existing path

const Users = () => {
  // Start with empty array, we will fill it from the Server
  const [users, setUsers] = useState([]);

  // 👇 POINT THIS TO YOUR BACKEND PORT 5001
  const API_URL = "http://localhost:5001/api/auth/users";

  // 1. Fetch Real Users from Database
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (response.ok) {
          // 2. ADAPT DATA: Convert DB fields to your UI fields
          // Database has: _id, username, email
          // UI expects: id, name, email, role, status
          const adaptedUsers = data.map(user => ({
            id: user._id,              // Map MongoDB '_id' to UI 'id'
            name: user.username,       // Map 'username' to 'name'
            email: user.email,
            role: 'Student',           // Default everyone to 'Student' for now
            status: 'Verified'         // Default to 'Verified' since they can already login
          }));
          setUsers(adaptedUsers);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleVerify = (id) => {
    // Logic to update user status in backend would go here
    const updatedUsers = users.map(user => 
      user.id === id ? { ...user, status: 'Verified' } : user
    );
    setUsers(updatedUsers);
  };

  return (
    <Layout>
      <div className="users-container">
        <div className="users-header">
          <h1 className="page-title">User Management</h1>
          <p style={{ color: '#666' }}>Verify and manage student, LGU, and NGO accounts.</p>
        </div>

        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <span className={`status-badge ${user.status.toLowerCase()}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    {user.status === 'Pending' ? (
                      <>
                        <button className="action-btn btn-approve" onClick={() => handleVerify(user.id)}>Approve</button>
                        <button className="action-btn btn-reject">Reject</button>
                      </>
                    ) : (
                      <span style={{ color: '#198754', fontSize: '14px' }}>✓ Active</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  Loading users or no users found...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default Users;