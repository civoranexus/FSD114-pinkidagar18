import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          🎓 EduVillage
        </Link>

        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">Home</Link>
          </li>
          <li className="nav-item">
            <Link to="/about" className="nav-link">About</Link>
          </li>
          <li className="nav-item">
            <Link to="/courses" className="nav-link">Courses</Link>
          </li>

          {!isAuthenticated ? (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-link">Login</Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-link-btn">Sign Up</Link>
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
                >
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <span className="nav-user">👤 {user?.name}</span>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="nav-link-btn logout-btn">
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;