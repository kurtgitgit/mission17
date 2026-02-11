import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Plus, Trash2, Edit, X, CheckCircle, Search } from 'lucide-react';
import '../../styles/Users.css'; 

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Student', // Default
    points: 0
  });

  const API_BASE = "http://localhost:5001/api/auth";

  // Helper to get token
  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/users`, {
        headers: {
          'auth-token': getToken() // 🛡️ ADDED TOKEN
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ username: '', email: '', password: '', role: 'Student', points: 0 });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setIsEditing(true);
    setCurrentUser(user);
    setFormData({ 
      username: user.username, 
      email: user.email, 
      password: '', // Keep empty unless changing
      role: user.role || 'Student',
      points: user.points || 0 
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const url = isEditing 
      ? `${API_BASE}/admin-update-user/${currentUser._id}`
      : `${API_BASE}/add-user`;
    
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'auth-token': getToken() // 🛡️ ADDED TOKEN
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        fetchUsers(); 
        setShowModal(false);
        alert(isEditing ? "User updated successfully!" : "User created successfully!");
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure? This action cannot be undone.")) {
      try {
        const res = await fetch(`${API_BASE}/delete-user/${id}`, { 
          method: 'DELETE',
          headers: {
            'auth-token': getToken() // 🛡️ ADDED TOKEN
          }
        });
        
        if (res.ok) {
          setUsers(users.filter(u => u._id !== id));
        } else {
          alert("Failed to delete user");
        }
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  // Helper to color-code roles
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Admin': return { bg: '#fee2e2', text: '#dc2626' }; // Red
      case 'LGU': return { bg: '#fef3c7', text: '#d97706' };   // Amber
      case 'NGO': return { bg: '#dcfce7', text: '#16a34a' };   // Green
      case 'Teacher': return { bg: '#e0e7ff', text: '#4f46e5' }; // Indigo
      default: return { bg: '#e0f2fe', text: '#0284c7' };      // Blue (Student)
    }
  };

  return (
    <Layout title="User Management">
      <div className="users-container">
        
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px'}}>
          <div>
            <h1 style={{fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0}}>User Management</h1>
            <p style={{color: '#64748b', margin: '4px 0 0 0'}}>Manage Students, LGUs, and NGO partners.</p>
          </div>

          <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
            <div style={{position: 'relative'}}>
              <Search size={18} color="#94a3b8" style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)'}} />
              <input 
                type="text" 
                placeholder="Search name, email, or role..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <button onClick={openAddModal} style={styles.addBtn}>
              <Plus size={18} /> Add User
            </button>
          </div>
        </div>

        {/* MODAL */}
        {showModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                <h2 style={{margin: 0}}>{isEditing ? 'Edit User' : 'Add New User'}</h2>
                <button onClick={() => setShowModal(false)} style={{background: 'none', border: 'none', cursor: 'pointer'}}><X /></button>
              </div>
              
              <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                <input type="text" name="username" placeholder="Full Name / Org Name" value={formData.username} onChange={handleChange} required style={styles.input} />
                <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required style={styles.input} />
                
                {!isEditing && (
                   <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required style={styles.input} />
                )}

                <div style={{display: 'flex', gap: '10px'}}>
                  <select name="role" value={formData.role} onChange={handleChange} style={{...styles.input, flex: 1}}>
                    <option value="student">Student</option>
                    <option value="Teacher">Teacher</option>
                    <option value="LGU">LGU (Local Govt)</option>
                    <option value="NGO">NGO (Partner)</option>
                    <option value="admin">Admin</option>
                  </select>
                  
                  <input type="number" name="points" placeholder="Points" value={formData.points} onChange={handleChange} style={{...styles.input, width: '80px'}} />
                </div>

                <button type="submit" style={styles.submitBtn}>
                  {isEditing ? 'Save Changes' : 'Create Account'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TABLE */}
        <div style={{backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead style={{backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0'}}>
              <tr>
                <th style={styles.th}>Name / Org</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Points</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{padding: '20px', textAlign: 'center'}}>Loading...</td></tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const badge = getRoleBadgeStyle(user.role);
                  return (
                    <tr key={user._id} style={{borderBottom: '1px solid #f1f5f9'}}>
                      <td style={styles.td}><strong>{user.username}</strong></td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>
                        <span style={{
                          padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', 
                          backgroundColor: badge.bg, color: badge.text, textTransform: 'uppercase'
                        }}>
                          {user.role || 'Student'}
                        </span>
                      </td>
                      <td style={styles.td}>{user.points || 0}</td>
                      <td style={styles.td}>
                        <span style={{display: 'flex', alignItems: 'center', gap: '5px', color: '#16a34a', fontWeight: '600', fontSize: '13px'}}>
                           <CheckCircle size={14} /> Active
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{display: 'flex', gap: '10px'}}>
                          <button onClick={() => openEditModal(user)} style={styles.actionBtn('#64748b')} title="Edit">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDelete(user._id)} style={styles.actionBtn('#ef4444')} title="Delete">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="6" style={{padding: '30px', textAlign: 'center', color: '#64748b'}}>No users found matching "{searchTerm}"</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  searchInput: { padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '250px', fontSize: '14px' },
  addBtn: { backgroundColor: '#3b82f6', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' },
  th: { padding: '16px', textAlign: 'left', fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '16px', fontSize: '14px', color: '#334155' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  submitBtn: { marginTop: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  actionBtn: (color) => ({ background: 'none', border: 'none', color: color, cursor: 'pointer', padding: '4px' }),
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }
};

export default Users;