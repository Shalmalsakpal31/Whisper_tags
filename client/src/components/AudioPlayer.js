import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { audioAPI } from '../services/api';

const AudioPlayer = () => {
  const { id } = useParams();
  const [clipInfo, setClipInfo] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [accessGranted, setAccessGranted] = useState(false);
  const [streamToken, setStreamToken] = useState(null);

  // messages you'd provided
  const successMessages = [
    "Your loved one’s voice, always just one scan away.",
    "Hear the ones you love — anytime, anywhere.",
    "A voice from someone you miss the most.",
    "Because their voice means more than words.",
    "A message from the heart, saved forever."
  ];

  const [msgIndex, setMsgIndex] = useState(() => Math.floor(Math.random() * successMessages.length));
  const [isFading, setIsFading] = useState(false);

  // rotate every 4s with a 400ms fade transition (fade-out -> switch -> fade-in)
  useEffect(() => {
    const rotateInterval = 4000; // how long each message stays visible
    const fadeDuration = 500;    // must match CSS transition duration

    const intervalId = setInterval(() => {
      // start fade out
      setIsFading(true);

      // after fadeDuration, switch the message and fade in
      const t = setTimeout(() => {
        setMsgIndex((i) => (i + 1) % successMessages.length);
        setIsFading(false);
      }, fadeDuration);

      // cleanup this timeout if interval runs again early or on unmount
      return () => clearTimeout(t);
    }, rotateInterval);

    return () => clearInterval(intervalId);
  }, []); // run once on mount


  const loadClipInfo = useCallback(async () => {
    try {
      const response = await audioAPI.getClipInfo(id);
      setClipInfo(response.data);
    } catch (error) {
      setError('Audio clip not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadClipInfo();
  }, [loadClipInfo]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setError('');

    try {
      const response = await audioAPI.verifyPassword(id, password);
      setAccessGranted(true);
      setStreamToken(response.data.streamToken);
    } catch (error) {
      setError(error.response?.data?.msg || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading audio clip...</div>
      </div>
    );
  }

  if (error && !clipInfo) {
    return (
      <div className="container">
        <div className="card">
          <div className="alert alert-error">
            {error}
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <a href="/" className="btn btn-primary">Back to Home</a>
          </div>
        </div>
      </div>
    );
  }

  if (accessGranted) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🎵 {clipInfo.title}</h2>
          </div>

          <div className="audio-player">
            {/* <div className="alert alert-success">
              ✅ {successMessages[successMsgIndex]}
            </div> */}
            <div
              className={`alert alert-success message-fade centered ${isFading ? 'fade-out' : 'fade-in'}`}
              aria-live="polite"
              role="status"
            >
              <span className="msg-icon" aria-hidden="true">❤️</span>
              <span className="msg-text">{successMessages[msgIndex]}</span>
            </div>




            {!streamToken ? (
              <div className="loading">Preparing secure stream...</div>
            ) : (
              <audio
                controls
                style={{ width: '100%', maxWidth: '500px' }}
                onError={(e) => {
                  console.error('Audio playback error:', e);
                  setError('Failed to load audio file. Please try again.');
                }}
                onLoadStart={() => console.log('Audio loading started')}
                onCanPlay={() => console.log('Audio can play')}
              >
                <source src={audioAPI.streamAudio(id, streamToken)} type={clipInfo.mimeType} />
                Your browser does not support the audio element.
              </audio>
            )}




            <div style={{ marginTop: '20px', color: '#666' }}>
              <p><strong>File size:</strong> {formatFileSize(clipInfo.fileSize)}</p>
              <p><strong>Format:</strong> {clipInfo.mimeType}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '500px', margin: '50px auto' }}>
        <div className="card-header">
          <h2 className="card-title">🔐 Audio Access</h2>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>{clipInfo?.title}</h3>
          <p style={{ color: '#666' }}>
            Enter the password to access this audio clip.
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={verifying}
            style={{ width: '100%' }}
          >
            {verifying ? 'Verifying...' : 'Access Audio'}
          </button>
        </form>

        {/* <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <a href="/" className="btn btn-secondary">Back to Home</a>
        </div> */}
      </div>
    </div>
  );
};

export default AudioPlayer;
