import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import '../styles/Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Initialize the hook

  const handleLogin = (e) => {
    e.preventDefault();
    console.log("Logging in with:", email, password);
    
    // FOR NOW: We just redirect to dashboard immediately
    // LATER: You will wrap this in an "if" statement checking the backend response
    navigate('/dashboard'); 
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Mission17 Admin</h2>
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <input 
              type="email" 
              placeholder="Admin Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="auth-button">Sign In</button>
        </form>
        <div className="auth-footer">
          Don't have an account? <Link to="/signup" className="auth-link">Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;