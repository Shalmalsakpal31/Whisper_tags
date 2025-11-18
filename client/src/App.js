import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import AudioPlayer from './components/AudioPlayer';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/audio/:id" element={<AudioPlayer />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </Router>
  );
}

function HomePage() {
  return (
    <div className="home-page">
      <div className="container">
        <h1>🎵 Audio Website</h1>
        <p>Secure Audio Clip Management System</p>
        <div className="home-actions">
          <a href="/admin" className="btn btn-primary">Admin Dashboard</a>
        </div>
      </div>
    </div>
  );
}

export default App;
