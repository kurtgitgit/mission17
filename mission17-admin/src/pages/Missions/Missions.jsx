import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Plus, Trash2, Edit } from 'lucide-react';
import '../../styles/Missions.css';

const Missions = () => {
  const [showForm, setShowForm] = useState(false);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 👇 1. INITIALIZE IMAGE STATE
  const [formData, setFormData] = useState({
    title: '',
    sdgNumber: '',
    points: '',
    description: '',
    color: '#3b82f6',
    image: '' // 👈 This was likely missing or empty
  });

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/auth/all-missions");
      const data = await response.json();
      setMissions(data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5001/api/auth/add-mission", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        fetchMissions();
        setShowForm(false);
        setFormData({ title: '', sdgNumber: '', points: '', description: '', color: '#3b82f6', image: '' });
      }
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this mission?")) {
      try {
        const res = await fetch(`http://localhost:5001/api/auth/delete-mission/${id}`, { method: 'DELETE' });
        if (res.ok) setMissions(missions.filter(m => m._id !== id));
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  return (
    <Layout>
      <div className="missions-container">
        <div className="missions-header">
          <div>
            <h1 className="page-title">Manage Missions</h1>
            <p style={{ color: '#666' }}>Create and track SDG activities.</p>
          </div>
          {!showForm && (
            <button className="add-btn" onClick={() => setShowForm(true)}>
              <Plus size={18} /> Add Mission
            </button>
          )}
        </div>

        {showForm && (
          <div className="mission-form-card">
            <h3>Create New Mission</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Mission Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder="e.g. Tree Planting" />
                </div>
                <div className="form-group">
                  <label>SDG Number</label>
                  <input type="number" name="sdgNumber" value={formData.sdgNumber} onChange={handleInputChange} required placeholder="1-17" />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Points Reward</label>
                  <input type="number" name="points" value={formData.points} onChange={handleInputChange} required placeholder="e.g. 100" />
                </div>
                <div className="form-group">
                  <label>Theme Color</label>
                  <input type="color" name="color" value={formData.color} onChange={handleInputChange} />
                </div>
              </div>

              {/* 👇 2. THIS INPUT WAS MISSING IN YOUR SCREENSHOT */}
              <div className="form-group">
                <label>Cover Image URL</label>
                <input 
                  type="url" 
                  name="image" 
                  value={formData.image} 
                  onChange={handleInputChange} 
                  placeholder="https://images.unsplash.com/..." 
                />
                <small style={{color: '#94a3b8', fontSize: '11px'}}>Paste a link ending in .jpg or .png</small>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Description</label>
                <textarea rows="3" name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe the mission objectives..."></textarea>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="add-btn">Publish Mission</button>
              </div>
            </form>
          </div>
        )}

        <table className="missions-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Goal</th>
              <th>Points</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td>Loading...</td></tr> : missions.map((mission) => (
              <tr key={mission._id}>
                <td>
                  {mission.image ? (
                    <img src={mission.image} alt="icon" style={{width: 30, height: 30, borderRadius: 4, objectFit: 'cover'}} />
                  ) : (
                    <div style={{width: 30, height: 30, background: '#eee', borderRadius: 4}}></div>
                  )}
                </td>
                <td>{mission.title}</td>
                <td>
                  <span className="badge" style={{ backgroundColor: mission.color || '#3b82f6', color: 'white' }}>
                    SDG {mission.sdgNumber}
                  </span>
                </td>
                <td><strong>{mission.points} pts</strong></td>
                <td>
                  <button className="action-icon delete" onClick={() => handleDelete(mission._id)}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default Missions;