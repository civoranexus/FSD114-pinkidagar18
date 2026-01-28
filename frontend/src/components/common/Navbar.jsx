import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeMobileMenu}>
          <span className="logo-icon">🎓</span>
          <span className="logo-text">EduVillage</span>
        </Link>

        {/* Mobile Menu Toggle */}
        <button 
          className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <li className="nav-item">
            <Link to="/" className="nav-link" onClick={closeMobileMenu}>
              <span className="nav-link-icon">🏠</span>
              <span>Home</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/about" className="nav-link" onClick={closeMobileMenu}>
              <span className="nav-link-icon">ℹ️</span>
              <span>About</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/courses" className="nav-link" onClick={closeMobileMenu}>
              <span className="nav-link-icon">📚</span>
              <span>Courses</span>
            </Link>
          </li>

          {!isAuthenticated ? (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-link" onClick={closeMobileMenu}>
                  <span className="nav-link-icon">🔐</span>
                  <span>Login</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-link-btn" onClick={closeMobileMenu}>
                  Sign Up
                </Link>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link 
                  to={
                    user?.role === 'student' ? '/student/dashboard' : 
                    user?.role === 'teacher' ? '/teacher/dashboard' : 
                    '/admin/dashboard'
                  } 
                  className="nav-link"
                  onClick={closeMobileMenu}
                >
                  <span className="nav-link-icon">📊</span>
                  <span>Dashboard</span>
                </Link>
              </li>
              <li className="nav-item nav-user-item">
                <div className="nav-user">
                  <span className="user-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                  <span className="user-name">{user?.name}</span>
                </div>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="nav-link-btn logout-btn">
                  <span>Logout</span>
                  <span className="logout-icon">🚪</span>
                </button>
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu}></div>
      )}
    </nav>
  );
};

export default Navbar;