import React, { useState, useEffect } from 'react';
/*  */import Layout from '../components/Layout'; // Correct path for src/pages/Events.jsx
import { Plus, Trash2, Edit, Search, X, Calendar, MapPin, Clock } from 'lucide-react';

const Events = () => {
    const [showForm, setShowForm] = useState(false);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // EDIT MODE STATE
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const [formData, setFormData] = useState({
        title: '', 
        date: '', 
        time: '', 
        location: '',
        color: '#3b82f6'
    });

    const API_BASE = "http://localhost:5001/api/auth";

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch(`${API_BASE}/events`);
            const data = await res.json();
            setEvents(data);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events.filter(e => 
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const openAddForm = () => {
        setIsEditing(false);
        setFormData({ title: '', date: '', time: '', location: '', color: '#3b82f6' });
        setShowForm(true);
    };

    const openEditForm = (event) => {
        setIsEditing(true);
        setCurrentId(event._id);
        setFormData({
            title: event.title,
            date: event.date,
            time: event.time,
            location: event.location,
            color: event.color || '#3b82f6'
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = isEditing ? `${API_BASE}/events/${currentId}` : `${API_BASE}/events`;
        const method = isEditing ? 'PUT' : 'POST';

        const token = localStorage.getItem('token');

        if (!token) {
            alert("You are not logged in! Please log in again.");
            return;
        }

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'auth-token': token 
                },
                body: JSON.stringify(formData)
            });
            
            const data = await res.json();

            if (res.ok) {
                fetchEvents();
                setShowForm(false);
                alert(isEditing ? "Event updated successfully!" : "Event created successfully!");
            } else {
                alert(`Failed: ${data.message || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Save error:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this event?")) {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_BASE}/events/${id}`, { 
                    method: 'DELETE',
                    headers: { 'auth-token': token }
                });

                if (res.ok) {
                    setEvents(events.filter(e => e._id !== id));
                } else {
                    alert("Failed to delete.");
                }
            } catch (error) {
                console.error("Delete error:", error);
            }
        }
    };

    return (
        <Layout title="Manage Events">
            <div className="missions-container" style={{ padding: '20px' }}>
                
                {/* HEADER SECTION */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px'}}>
                    <div>
                        <h1 style={{fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0}}>Manage Events</h1>
                        <p style={{color: '#64748b', margin: '4px 0 0 0'}}>Schedule and track community activities.</p>
                    </div>

                    <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                        <div style={{position: 'relative'}}>
                            <Search size={18} color="#94a3b8" style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)'}} />
                            <input type="text" placeholder="Search events..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
                        </div>
                        <button onClick={openAddForm} style={styles.addBtn}><Plus size={18} /> Add Event</button>
                    </div>
                </div>

                {/* FORM MODAL */}
                {showForm && (
                    <div style={styles.formCard}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                            <h3 style={{margin: 0}}>{isEditing ? 'Edit Event' : 'Create New Event'}</h3>
                            <button onClick={() => setShowForm(false)} style={{background: 'none', border: 'none', cursor: 'pointer'}}><X size={20} color="#64748b"/></button>
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            <div style={{display: 'flex', gap: '20px', marginBottom: '15px'}}>
                                <div style={{flex: 2}}>
                                    <label style={styles.label}>Event Title</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder="e.g. Beach Cleanup" style={styles.input} />
                                </div>
                                <div style={{flex: 1}}>
                                    <label style={styles.label}>Theme Color</label>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', height: '42px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 10px'}}>
                                        <input type="color" name="color" value={formData.color} onChange={handleInputChange} style={{border: 'none', background: 'none', width: '30px', height: '30px', cursor: 'pointer'}} />
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{display: 'flex', gap: '20px', marginBottom: '15px'}}>
                                <div style={{flex: 1}}>
                                    <label style={styles.label}>Date</label>
                                    <input type="date" name="date" value={formData.date} onChange={handleInputChange} required style={styles.input} />
                                </div>
                                <div style={{flex: 1}}>
                                    <label style={styles.label}>Time</label>
                                    <input type="time" name="time" value={formData.time} onChange={handleInputChange} required style={styles.input} />
                                </div>
                            </div>

                            <div style={{marginBottom: '20px'}}>
                                <label style={styles.label}>Location</label>
                                <div style={{position: 'relative'}}>
                                    <MapPin size={18} color="#94a3b8" style={{position: 'absolute', left: '12px', top: '12px'}} />
                                    <input type="text" name="location" value={formData.location} onChange={handleInputChange} required placeholder="e.g. City Hall" style={{...styles.input, paddingLeft: '40px'}} />
                                </div>
                            </div>

                            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                                <button type="button" onClick={() => setShowForm(false)} style={styles.cancelBtn}>Cancel</button>
                                <button type="submit" style={styles.submitBtn}>{isEditing ? 'Update Event' : 'Publish Event'}</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* EVENTS TABLE */}
                <div style={{backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden'}}>
                    <table style={{width: '100%', borderCollapse: 'collapse'}}>
                        <thead style={{backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0'}}>
                            <tr>
                                <th style={styles.th}>Title</th>
                                <th style={styles.th}>Date & Time</th>
                                <th style={styles.th}>Location</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" style={{padding: '30px', textAlign: 'center'}}>Loading...</td></tr>
                            ) : filteredEvents.length > 0 ? (
                                filteredEvents.map((event) => (
                                    <tr key={event._id} style={{borderBottom: '1px solid #f1f5f9'}}>
                                        <td style={styles.td}>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                                <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: event.color || '#3b82f6'}}></div>
                                                <strong>{event.title}</strong>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px'}}>
                                                <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><Calendar size={14} color="#64748b"/> {event.date}</span>
                                                <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><Clock size={14} color="#64748b"/> {event.time}</span>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><MapPin size={14} color="#64748b"/> {event.location}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{display: 'flex', gap: '8px'}}>
                                                <button onClick={() => openEditForm(event)} style={styles.actionBtn('#3b82f6')} title="Edit"><Edit size={18} /></button>
                                                <button onClick={() => handleDelete(event._id)} style={styles.actionBtn('#ef4444')} title="Delete"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" style={{padding: '30px', textAlign: 'center', color: '#64748b'}}>No events found matching "{searchTerm}"</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

// Internal Styles (Matching Missions.jsx)
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

export default Events;