import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Auth.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = (e) => {
    e.preventDefault();
    if(formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log("Signing up:", formData);
    // TODO: Connect to Node.js backend later
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Create Admin Account</h2>
        <form className="auth-form" onSubmit={handleSignup}>
          <div className="form-group">
            <input 
              type="text" 
              name="fullName"
              placeholder="Full Name" 
              value={formData.fullName}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="form-group">
            <input 
              type="email" 
              name="email"
              placeholder="Email Address" 
              value={formData.email}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="form-group">
            <input 
              type="password" 
              name="password"
              placeholder="Password" 
              value={formData.password}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="form-group">
            <input 
              type="password" 
              name="confirmPassword"
              placeholder="Confirm Password" 
              value={formData.confirmPassword}
              onChange={handleChange}
              required 
            />
          </div>
          <button type="submit" className="auth-button">Register</button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/" className="auth-link">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;