import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import '../styles/Auth.css';
import logoImg from '../assets/logo.png';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        
        {/* Logo Header */}
        <div className="login-logo">
          <div className="logo-icon-box">
              <img src={logoImg} alt="Mission17 Logo" className="actual-logo" />
            <ShieldCheck size={28} />
          </div>
          <div className="logo-text-box">
            <h2>MISSION17</h2>
            <p>Gamified Community Action</p>
          </div>
        </div>

        <h1 className="welcome-title">Welcome back!</h1>
        <p className="welcome-subtitle">Ready to monitor the progress?</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <User className="input-icon" size={20} />
            <input 
              type="text" 
              name="email"
              placeholder="Username/Email" 
              className="login-input"
              value={formData.email}
              onChange={handleChange}
              required 
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              name="password"
              placeholder="Password" 
              className="login-input"
              value={formData.password}
              onChange={handleChange}
              required 
            />
            <div 
              className="password-toggle" 
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>

          <a href="#" className="forgot-password">Forgot Password?</a>

          <button type="submit" className="signin-btn">
            Sign in
          </button>
        </form>

        <p className="footer-text">Together we can achieve the Global Goals.</p>
      </div>
    </div>
  );
};

export default Login;