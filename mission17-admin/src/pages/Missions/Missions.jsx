import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Plus, Trash2, Edit, Search, X, Image as ImageIcon } from 'lucide-react';
import '../../styles/Missions.css'; // Ensure you have this CSS file

const Missions = () => {
  const [showForm, setShowForm] = useState(false);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // EDIT MODE STATE
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    sdgNumber: '',
    points: '',
    description: '',
    color: '#3b82f6',
    image: ''
  });

  // 👇 API BASE URL (Adjust port if needed)
  const API_BASE = "http://localhost:5001/api/auth";

  useEffect(() => {
    fetchMissions();
  }, []);

  // 1. READ: Fetch Missions
  const fetchMissions = async () => {
    try {
      const response = await fetch(`${API_BASE}/all-missions`);
      const data = await response.json();
      setMissions(data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 SEARCH FILTER
  const filteredMissions = missions.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.sdgNumber.toString().includes(searchTerm)
  );

  // Handle Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Open Form for NEW Mission
  const openAddForm = () => {
    setIsEditing(false);
    setFormData({ title: '', sdgNumber: '', points: '', description: '', color: '#3b82f6', image: '' });
    setShowForm(true);
  };

  // Open Form for EDIT Mission
  const openEditForm = (mission) => {
    setIsEditing(true);
    setCurrentId(mission._id);
    setFormData({
      title: mission.title,
      sdgNumber: mission.sdgNumber,
      points: mission.points,
      description: mission.description || '',
      color: mission.color || '#3b82f6',
      image: mission.image || ''
    });
    setShowForm(true);
  };

  // 2. CREATE & 3. UPDATE: Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Determine Endpoint and Method based on mode
    const url = isEditing 
      ? `${API_BASE}/update-mission/${currentId}` 
      : `${API_BASE}/add-mission`;
    
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        fetchMissions();
        setShowForm(false);
        alert(isEditing ? "Mission updated successfully!" : "Mission created successfully!");
      } else {
        alert("Failed to save mission. Please check the backend console.");
      }
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  // 4. DELETE: Remove Mission
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this mission?")) {
      try {
        const res = await fetch(`${API_BASE}/delete-mission/${id}`, { method: 'DELETE' });
        if (res.ok) setMissions(missions.filter(m => m._id !== id));
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  return (
    <Layout>
      <div className="missions-container">
        
        {/* HEADER SECTION */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px'}}>
          <div>
            <h1 style={{fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0}}>Manage Missions</h1>
            <p style={{color: '#64748b', margin: '4px 0 0 0'}}>Create and track SDG activities.</p>
          </div>

          <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
            {/* Search Bar */}
            <div style={{position: 'relative'}}>
              <Search size={18} color="#94a3b8" style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)'}} />
              <input 
                type="text" 
                placeholder="Search missions..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <button onClick={openAddForm} style={styles.addBtn}>
              <Plus size={18} /> Add Mission
            </button>
          </div>
        </div>

        {/* FORM MODAL / CARD */}
        {showForm && (
          <div style={styles.formCard}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
              <h3 style={{margin: 0}}>{isEditing ? 'Edit Mission' : 'Create New Mission'}</h3>
              <button onClick={() => setShowForm(false)} style={{background: 'none', border: 'none', cursor: 'pointer'}}><X size={20} color="#64748b"/></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{display: 'flex', gap: '20px', marginBottom: '15px'}}>
                <div style={{flex: 2}}>
                  <label style={styles.label}>Mission Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder="e.g. Tree Planting" style={styles.input} />
                </div>
                <div style={{flex: 1}}>
                  <label style={styles.label}>SDG #</label>
                  <input type="number" name="sdgNumber" value={formData.sdgNumber} onChange={handleInputChange} required placeholder="1-17" style={styles.input} />
                </div>
              </div>
              
              <div style={{display: 'flex', gap: '20px', marginBottom: '15px'}}>
                <div style={{flex: 1}}>
                  <label style={styles.label}>Points</label>
                  <input type="number" name="points" value={formData.points} onChange={handleInputChange} required placeholder="100" style={styles.input} />
                </div>
                <div style={{flex: 1}}>
                  <label style={styles.label}>Theme Color</label>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px', height: '42px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 10px'}}>
                    <input type="color" name="color" value={formData.color} onChange={handleInputChange} style={{border: 'none', background: 'none', width: '30px', height: '30px', cursor: 'pointer'}} />
                    <span style={{fontSize: '13px', color: '#64748b'}}>{formData.color}</span>
                  </div>
                </div>
              </div>

              <div style={{marginBottom: '15px'}}>
                <label style={styles.label}>Cover Image URL</label>
                <div style={{position: 'relative'}}>
                  <ImageIcon size={18} color="#94a3b8" style={{position: 'absolute', left: '12px', top: '12px'}} />
                  <input type="url" name="image" value={formData.image} onChange={handleInputChange} placeholder="https://..." style={{...styles.input, paddingLeft: '40px'}} />
                </div>
                {formData.image && (
                  <div style={{marginTop: '10px', width: '100px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0'}}>
                    <img src={formData.image} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  </div>
                )}
              </div>

              <div style={{marginBottom: '20px'}}>
                <label style={styles.label}>Description</label>
                <textarea rows="3" name="description" value={formData.description} onChange={handleInputChange} placeholder="Objectives..." style={{...styles.input, height: 'auto'}}></textarea>
              </div>

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                <button type="button" onClick={() => setShowForm(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" style={styles.submitBtn}>{isEditing ? 'Update Mission' : 'Publish Mission'}</button>
              </div>
            </form>
          </div>
        )}

        {/* MISSIONS TABLE */}
        <div style={{backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead style={{backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0'}}>
              <tr>
                <th style={styles.th}>Image</th>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Goal</th>
                <th style={styles.th}>Points</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{padding: '30px', textAlign: 'center'}}>Loading...</td></tr>
              ) : filteredMissions.length > 0 ? (
                filteredMissions.map((mission) => (
                  <tr key={mission._id} style={{borderBottom: '1px solid #f1f5f9'}}>
                    <td style={styles.td}>
                      {mission.image ? (
                        <img src={mission.image} alt="icon" style={{width: 40, height: 40, borderRadius: 6, objectFit: 'cover'}} />
                      ) : (
                        <div style={{width: 40, height: 40, background: '#f1f5f9', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          <ImageIcon size={16} color="#cbd5e1"/>
                        </div>
                      )}
                    </td>
                    <td style={styles.td}><strong>{mission.title}</strong></td>
                    <td style={styles.td}>
                      <span style={{ backgroundColor: mission.color || '#3b82f6', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                        SDG {mission.sdgNumber}
                      </span>
                    </td>
                    <td style={styles.td}>{mission.points} pts</td>
                    <td style={styles.td}>
                      <div style={{display: 'flex', gap: '8px'}}>
                        <button onClick={() => openEditForm(mission)} style={styles.actionBtn('#3b82f6')} title="Edit">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(mission._id)} style={styles.actionBtn('#ef4444')} title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{padding: '30px', textAlign: 'center', color: '#64748b'}}>No missions found matching "{searchTerm}"</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

// Internal Styles
const styles = {
  searchInput: { padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '250px', fontSize: '14px' },
  addBtn: { backgroundColor: '#3b82f6', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' },
  formCard: { backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', marginBottom: '30px', border: '1px solid #e2e8f0' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' },
  cancelBtn: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', cursor: 'pointer', fontWeight: '600' },
  submitBtn: { padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: '600' },
  th: { padding: '16px', textAlign: 'left', fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '16px', fontSize: '14px', color: '#334155' },
  actionBtn: (color) => ({ background: 'none', border: 'none', color: color, cursor: 'pointer', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }),
};

export default Missions;