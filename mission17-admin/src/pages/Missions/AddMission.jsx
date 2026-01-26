import React, { useState } from 'react';
import Layout from '../../components/Layout';
import '../../styles/Missions.css'; // You can create this for styling

const AddMission = () => {
  const [formData, setFormData] = useState({
    title: '',
    sdgNumber: '',
    description: '',
    color: '#3b82f6',
    points: 100
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5001/api/auth/add-mission", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        alert("🚀 Mission Published! Kurt can now see this on his phone.");
        setFormData({ title: '', sdgNumber: '', description: '', color: '#3b82f6', points: 100 });
      }
    } catch (error) {
      console.error("Error adding mission:", error);
    }
  };

  return (
    <Layout>
      <div className="add-mission-container">
        <h1>Create New SDG Mission</h1>
        <form onSubmit={handleSubmit} className="mission-form">
          <div className="form-group">
            <label>Mission Title</label>
            <input 
              type="text" 
              placeholder="e.g., Campus Tree Planting" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>SDG Number</label>
              <input 
                type="number" 
                placeholder="1-17" 
                value={formData.sdgNumber}
                onChange={(e) => setFormData({...formData, sdgNumber: e.target.value})}
                required 
              />
            </div>
            <div className="form-group">
              <label>Theme Color</label>
              <input 
                type="color" 
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description / Instructions</label>
            <textarea 
              placeholder="What should the agent do?" 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <button type="submit" className="btn-publish">Publish to Mobile App</button>
        </form>
      </div>
    </Layout>
  );
};

export default AddMission;