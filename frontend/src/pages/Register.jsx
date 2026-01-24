import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long!');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      login(data.token, data.user);
      toast.success(`Welcome to EduVillage, ${data.user.name}! 🎉`);

      setTimeout(() => {
        if (data.user.role === 'student') {
          navigate('/student/dashboard');
        } else if (data.user.role === 'teacher') {
          navigate('/teacher/dashboard');
        } else if (data.user.role === 'admin') {
          navigate('/admin/dashboard');
        }
      }, 500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
        <div className="auth-form-section-center">
          <div className="form-wrapper">
            {/* Logo Header */}
            <div className="form-logo">
              <div className="logo-icon">🎓</div>
              <h1 className="logo-text">EduVillage</h1>
            </div>

            <div className="form-header">
              <h2>Create Your Account</h2>
              <p>Join thousands of learners transforming their careers</p>
            </div>

            {/* Role Selection */}
            <div className="role-selection">
              <p className="role-label">I want to join as a:</p>
              <div className="role-options">
                <label className={`role-option ${formData.role === 'student' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={formData.role === 'student'}
                    onChange={handleChange}
                  />
                  <div className="role-card">
                    <span className="role-emoji">👨‍🎓</span>
                    <span className="role-name">Student</span>
                  </div>
                </label>
                <label className={`role-option ${formData.role === 'teacher' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={formData.role === 'teacher'}
                    onChange={handleChange}
                  />
                  <div className="role-card">
                    <span className="role-emoji">👨‍🏫</span>
                    <span className="role-name">Teacher</span>
                  </div>
                </label>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="premium-form">
              <div className="input-group">
                <label htmlFor="name">Full Name</label>
                <div className="input-container">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

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
                    placeholder="Create a strong password"
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

              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-container">
                  <span className="input-icon">🔐</span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="terms-checkbox">
                <label className="checkbox-wrapper">
                  <input type="checkbox" required />
                  <span>
                    I agree to the <a href="#" className="terms-link">Terms of Service</a> and{' '}
                    <a href="#" className="terms-link">Privacy Policy</a>
                  </span>
                </label>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <span className="btn-icon">→</span>
                  </>
                )}
              </button>
            </form>

            <div className="signup-prompt">
              <p>Already have an account? <Link to="/login" className="signup-link">Sign In →</Link></p>
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

export default Register;