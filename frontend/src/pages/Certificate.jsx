import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Certificate.css';

const Certificate = () => {
  const { progressId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificate();
  }, [progressId]);

  const fetchCertificate = async () => {
    try {
      const { data } = await api.get(`/progress/certificate/${progressId}`);
      setCertificate(data.data);
    } catch (error) {
      toast.error('Failed to load certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
    return <div className="loading">Loading certificate...</div>;
  }

  if (!certificate) {
    return <div className="error">Certificate not found</div>;
  }

  return (
    <div className="certificate-page">
      <div className="certificate">
        <div className="certificate-border">
          <div className="certificate-content">
            <h1 className="certificate-logo">🎓 EduVillage</h1>
            <h2 className="certificate-title">Certificate of Completion</h2>
            
            <p className="certificate-text">This is to certify that</p>
            <h3 className="student-name">{certificate.studentName}</h3>
            
            <p className="certificate-text">has successfully completed</p>
            <h4 className="course-name">{certificate.courseName}</h4>
            
            <div className="certificate-details">
              <p>Completion Date: {new Date(certificate.completionDate).toLocaleDateString()}</p>
              <p>Certificate ID: {certificate.certificateId}</p>
            </div>
            
            <div className="signatures">
              <div className="signature">
                <div className="signature-line"></div>
                <p>{certificate.instructorName}</p>
                <p className="signature-title">Course Instructor</p>
              </div>
              <div className="signature">
                <div className="signature-line"></div>
                <p>Civora Nexus</p>
                <p className="signature-title">Platform Director</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="certificate-actions">
        <button onClick={handleDownload} className="btn-download">
          📥 Download Certificate
        </button>
      </div>
    </div>
  );
};

export default Certificate;