import React from 'react';
import Layout from '../../components/Layout';
import { Edit, BookOpen, Video } from 'lucide-react';
import '../../styles/Learning.css';

const Learning = () => {
  // Static data for the 17 SDGs with their official colors
  const sdgData = [
    { id: 1, title: 'No Poverty', color: '#E5243B', resources: 3 },
    { id: 2, title: 'Zero Hunger', color: '#DDA63A', resources: 2 },
    { id: 3, title: 'Good Health', color: '#4C9F38', resources: 5 },
    { id: 4, title: 'Quality Education', color: '#C5192D', resources: 8 },
    { id: 5, title: 'Gender Equality', color: '#FF3A21', resources: 4 },
    { id: 6, title: 'Clean Water', color: '#26BDE2', resources: 3 },
    { id: 7, title: 'Clean Energy', color: '#FCC30B', resources: 2 },
    { id: 8, title: 'Decent Work', color: '#A21942', resources: 1 },
    // You can add the rest (9-17) later
  ];

  const handleEdit = (id) => {
    alert(`Opening editor for SDG ${id}... (Feature coming in Backend Phase)`);
  };

  return (
    <Layout>
      <div className="learning-container">
        <div className="learning-header">
          <h1 className="page-title">Learning Hub Manager</h1>
          <p style={{ color: '#666' }}>Upload educational resources (PDFs, Videos) for each SDG.</p>
        </div>

        <div className="sdg-grid">
          {sdgData.map((sdg) => (
            <div key={sdg.id} className="sdg-card" style={{ backgroundColor: sdg.color }}>
              <div className="sdg-content">
                <span className="sdg-number">{sdg.id}</span>
                <span className="sdg-title">{sdg.title}</span>
              </div>
              
              <div className="sdg-actions">
                <div className="resource-count">
                  <BookOpen size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                  {sdg.resources} Resources
                </div>
                <button className="edit-btn" onClick={() => handleEdit(sdg.id)}>
                  <Edit size={14} /> Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Learning;