import React, { useState } from 'react';
import Layout from '../../components/Layout';
import '../../styles/Users.css';

const Users = () => {
  // Dummy data simulating users from MongoDB
  const [users, setUsers] = useState([
    { id: 101, name: 'Juan Dela Cruz', email: 'juan@student.edu', role: 'Student', status: 'Verified' },
    { id: 102, name: 'Brgy. San Jose LGU', email: 'admin@sanjose.gov', role: 'LGU', status: 'Pending' },
    { id: 103, name: 'Maria Santos', email: 'maria@ngo.org', role: 'NGO', status: 'Pending' },
  ]);

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
            {users.map((user) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default Users;