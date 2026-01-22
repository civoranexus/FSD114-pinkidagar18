import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', formData);
      const { token, user: userData } = data.data;

      login(token, userData);
      toast.success(`Welcome back, ${userData.name}! 🎉`);

      setTimeout(() => {
        if (userData.role === 'student') {
          navigate('/student/dashboard');
        } else if (userData.role === 'teacher') {
          navigate('/teacher/dashboard');
        } else if (userData.role === 'admin') {
          navigate('/admin/dashboard');
        }
      }, 500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (email, password) => {
    setFormData({ email, password });
    toast.info('Demo account loaded! Click Sign In to continue.', { autoClose: 2000 });
  };

  return (
    <div className="auth-page-wrapper">
      {/* Animated Background */}
      <div className="auth-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
        <div className="bg-shape shape-4"></div>
      </div>

      <div className="auth-container-center">
        {/* Centered Login Form */}
        <div className="auth-form-section-center">
          <div className="form-wrapper">
            {/* Logo Header */}
            <div className="form-logo">
              <div className="logo-icon">🎓</div>
              <h1 className="logo-text">EduVillage</h1>
            </div>

            <div className="form-header">
              <h2>Welcome Back!</h2>
              <p>Sign in to continue your learning journey</p>
            </div>

            {/* Demo Accounts Banner */}
            <div className="demo-banner">
              <div className="demo-banner-header">
                <span className="demo-icon">⚡</span>
                <span className="demo-text">Quick Access Demo Accounts</span>
              </div>
              <div className="demo-accounts-grid">
                <button
                  onClick={() => fillDemoAccount('student@test.com', 'password123')}
                  className="demo-card student-demo"
                  type="button"
                >
                  <span className="demo-emoji">👨‍🎓</span>
                  <span className="demo-role">Student</span>
                </button>
                <button
                  onClick={() => fillDemoAccount('teacher@test.com', 'password123')}
                  className="demo-card teacher-demo"
                  type="button"
                >
                  <span className="demo-emoji">👨‍🏫</span>
                  <span className="demo-role">Teacher</span>
                </button>
                <button
                  onClick={() => fillDemoAccount('superadmin@eduvillage.com', 'admin123')}
                  className="demo-card admin-demo"
                  type="button"
                >
                  <span className="demo-emoji">👑</span>
                  <span className="demo-role">Admin</span>
                </button>
              </div>
            </div>

            <div className="divider">
              <span>or sign in with email</span>
            </div>

            <form onSubmit={handleSubmit} className="premium-form">
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-container">
                  <span className="input-icon">📧</span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="input-container">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-extras">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Signing you in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span className="btn-icon">→</span>
                  </>
                )}
              </button>
            </form>

            <div className="signup-prompt">
              <p>Don't have an account? <Link to="/register" className="signup-link">Create one now →</Link></p>
            </div>

            <div className="security-note">
              <span className="security-icon">🔐</span>
              <span>Your information is secure and encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;