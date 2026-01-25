import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { Plus, Trash2, Edit } from 'lucide-react';
import '../../styles/Missions.css'; // Import the separate CSS

const Missions = () => {
  const [showForm, setShowForm] = useState(false);
  
  // Dummy data to simulate existing missions
  const [missions, setMissions] = useState([
    { id: 1, title: 'Coastal Cleanup', category: 'Environment', points: 50, date: '2026-02-15' },
    { id: 2, title: 'Math Tutoring', category: 'Education', points: 30, date: '2026-02-20' },
  ]);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Environment',
    points: '',
    date: '',
    description: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add new mission to the list (simulating backend)
    const newMission = { ...formData, id: missions.length + 1 };
    setMissions([...missions, newMission]);
    setShowForm(false); // Hide form after submit
    setFormData({ title: '', category: 'Environment', points: '', date: '', description: '' }); // Reset form
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

        {/* Add Mission Form (Collapsible) */}
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
                  <label>SDG Category</label>
                  <select name="category" value={formData.category} onChange={handleInputChange}>
                    <option value="Environment">Environment (SDG 13, 14, 15)</option>
                    <option value="Health">Health (SDG 3)</option>
                    <option value="Education">Education (SDG 4)</option>
                    <option value="Equality">Equality (SDG 5, 10)</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Points Reward</label>
                  <input type="number" name="points" value={formData.points} onChange={handleInputChange} required placeholder="e.g. 50" />
                </div>
                <div className="form-group">
                  <label>Deadline / Date</label>
                  <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Description</label>
                <textarea rows="3" name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe the mission objectives..."></textarea>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="add-btn">Save Mission</button>
              </div>
            </form>
          </div>
        )}

        {/* Missions List Table */}
        <table className="missions-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Date</th>
              <th>Points</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {missions.map((mission) => (
              <tr key={mission.id}>
                <td>{mission.title}</td>
                <td>
                  <span className={`badge ${mission.category.toLowerCase()}`}>
                    {mission.category}
                  </span>
                </td>
                <td>{mission.date}</td>
                <td><strong>{mission.points} pts</strong></td>
                <td>
                  <button style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', marginRight: '10px' }}>
                    <Edit size={18} />
                  </button>
                  <button style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }}>
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