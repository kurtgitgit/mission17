import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
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
    // Add your actual login logic here later
    navigate('/dashboard');
  };

  return (
    <div className="auth-container">
      
      {/* LEFT SIDE: BRANDING PANEL */}
      <div className="auth-sidebar">
        <div className="sidebar-content">
          <div className="brand-box">
            <img src={logoImg} alt="Mission17 Logo" className="sidebar-logo" />
            <h1 className="brand-title">MISSION17</h1>
            <p className="brand-tagline">Gamified Community Action</p>
          </div>
          <div className="sidebar-footer">
            <p>© 2026 Admin Console</p>
          </div>
        </div>
        {/* Abstract shapes for visual interest */}
        <div className="circle-decoration circle-1"></div>
        <div className="circle-decoration circle-2"></div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="auth-main">
        <div className="form-wrapper">
          <div className="form-header">
            <h2>Welcome back</h2>
            <p>Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            
            {/* EMAIL INPUT */}
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail className="field-icon" size={18} />
                <input 
                  type="text" 
                  name="email"
                  placeholder="admin@mission17.com" 
                  value={formData.email}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock className="field-icon" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  placeholder="••••••••" 
                  value={formData.password}
                  onChange={handleChange}
                  required 
                />
                <button 
                  type="button"
                  className="eye-btn" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-extras">
              <label className="checkbox-container">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Remember me
              </label>
              <a href="#" className="forgot-link">Forgot Password?</a>
            </div>

            <button type="submit" className="submit-btn">
              Sign In <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;