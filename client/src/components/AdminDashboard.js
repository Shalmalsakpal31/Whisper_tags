import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import LoginForm from './LoginForm';
import UploadForm from './UploadForm';
import ClipsList from './ClipsList';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clips, setClips] = useState([]);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      // Optimistically set authenticated and try loading clips
      setIsAuthenticated(true);
      loadClips();
    } else {
      setLoading(false);
    }
  }, []);

  const loadClips = async () => {
    try {
      const response = await adminAPI.getClips();
      setClips(response.data);
    } catch (error) {
      console.error('Failed to load clips:', error);
      // Reset auth if token invalid/expired
      localStorage.removeItem('adminToken');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (token) => {
    localStorage.setItem('adminToken', token);
    setIsAuthenticated(true);
    setLoading(true);
    loadClips();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setClips([]);
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    loadClips();
  };

  const handleDeleteClip = async (id) => {
    if (window.confirm('Are you sure you want to delete this audio clip?')) {
      try {
        await adminAPI.deleteClip(id);
        setClips(clips.filter(clip => clip._id !== id));
      } catch (error) {
        console.error('Failed to delete clip:', error);
        alert('Failed to delete clip');
      }
    }
  };

  const handleShareClip = async (id) => {
    try {
      const response = await adminAPI.getShareLink(id);
      const shareLink = response.data.shareLink;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareLink);
      alert('Share link copied to clipboard!');
    } catch (error) {
      console.error('Failed to get share link:', error);
      alert('Failed to get share link');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">🎵 Admin Dashboard</h1>
          <button onClick={handleLogout} className="btn btn-danger btn-small">
            Logout
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={() => setShowUpload(!showUpload)}
            className="btn btn-primary"
          >
            {showUpload ? 'Hide Upload Form' : 'Upload New Audio'}
          </button>
        </div>

        {showUpload && (
          <UploadForm 
            onSuccess={handleUploadSuccess}
            onCancel={() => setShowUpload(false)}
          />
        )}

        <ClipsList 
          clips={clips}
          onDelete={handleDeleteClip}
          onShare={handleShareClip}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
