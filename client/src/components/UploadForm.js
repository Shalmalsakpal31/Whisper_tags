import React, { useState } from 'react';
import { adminAPI } from '../services/api';

const UploadForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    password: '',
    audio: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate password strength when password changes
    if (name === 'password') {
      validatePassword(value);
    }
  };

  const validatePassword = (password) => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }

    const strength = {
      score: 0,
      feedback: [],
      isValid: false
    };

    // Length scoring
    if (password.length >= 6) strength.score += 1;
    if (password.length >= 8) strength.score += 1;
    if (password.length >= 12) strength.score += 1;

    // Character type scoring
    if (/[a-z]/.test(password)) strength.score += 1;
    if (/[A-Z]/.test(password)) strength.score += 1;
    if (/[0-9]/.test(password)) strength.score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength.score += 1;

    // Pattern detection
    if (/(.)\1{2,}/.test(password)) {
      strength.score -= 1;
      strength.feedback.push('Avoid repeating characters');
    }

    if (/123|abc|qwe/i.test(password)) {
      strength.score -= 1;
      strength.feedback.push('Avoid common sequences');
    }

    // Strength level
    if (strength.score >= 5) {
      strength.feedback.push('Strong password');
      strength.isValid = true;
    } else if (strength.score >= 3) {
      strength.feedback.push('Medium strength');
      strength.isValid = true;
    } else {
      strength.feedback.push('Weak password - consider using a longer password with mixed characters');
    }

    setPasswordStrength(strength);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        audio: file
      }));
    }
  };

  const generatePassword = async (type = 'secure') => {
    try {
      const response = await adminAPI.generatePassword(type);
      setFormData(prev => ({
        ...prev,
        password: response.data.password
      }));
    } catch (error) {
      console.error('Failed to generate password:', error);
      // Fallback to local generation
      const fallbackPassword = generateSecurePassword(12, true, true, true, false);
      setFormData(prev => ({
        ...prev,
        password: fallbackPassword
      }));
    }
  };

  const generateSecurePassword = (length, includeUpper, includeLower, includeNumbers, includeSymbols) => {
    let charset = '';
    if (includeUpper) charset += 'ABCDEFGHJKMNPQRSTUVWXYZ';
    if (includeLower) charset += 'abcdefghjkmnpqrstuvwxyz';
    if (includeNumbers) charset += '23456789';
    if (includeSymbols) charset += '!@#$%^&*';
    
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const generateMemorablePassword = (wordCount, separator) => {
    const words = [
      'apple', 'banana', 'cherry', 'dragon', 'eagle', 'forest', 'garden', 'happy',
      'island', 'jungle', 'knight', 'lizard', 'mountain', 'ocean', 'panda', 'queen',
      'river', 'sunset', 'tiger', 'umbrella', 'violet', 'winter', 'yellow', 'zebra'
    ];
    
    const selectedWords = [];
    for (let i = 0; i < wordCount; i++) {
      const randomWord = words[Math.floor(Math.random() * words.length)];
      selectedWords.push(randomWord);
    }
    
    return selectedWords.join(separator);
  };

  const generatePIN = (length) => {
    let pin = '';
    for (let i = 0; i < length; i++) {
      pin += Math.floor(Math.random() * 10).toString();
    }
    return pin;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.audio) {
      setError('Please select an audio file');
      setLoading(false);
      return;
    }

    try {
      const uploadData = new FormData();
      uploadData.append('title', formData.title);
      uploadData.append('password', formData.password);
      uploadData.append('audio', formData.audio);

      const response = await adminAPI.uploadAudio(uploadData);
      
      setSuccess('Audio uploaded successfully!');
      setFormData({ title: '', password: '', audio: null });
      
      // Reset file input
      const fileInput = document.getElementById('audio');
      if (fileInput) fileInput.value = '';
      
      setTimeout(() => {
        onSuccess();
      }, 1500);
      
    } catch (error) {
      setError(error.response?.data?.msg || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">📤 Upload Audio Clip</h3>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className="form-input"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter audio clip title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password *
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              id="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter or generate password"
              required
              style={{ flex: 1 }}
            />
            <div style={{ display: 'flex', gap: '5px' }}>
              <button
                type="button"
                onClick={() => generatePassword('secure')}
                className="btn btn-secondary btn-small"
                title="Generate secure password"
              >
                🔐
              </button>
              <button
                type="button"
                onClick={() => generatePassword('memorable')}
                className="btn btn-secondary btn-small"
                title="Generate memorable password"
              >
                🧠
              </button>
              <button
                type="button"
                onClick={() => generatePassword('pin')}
                className="btn btn-secondary btn-small"
                title="Generate PIN"
              >
                🔢
              </button>
            </div>
          </div>
          
          {/* Password Strength Indicator */}
          {passwordStrength && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '4px'
              }}>
                <span style={{ fontSize: '0.9rem', color: '#666' }}>Strength:</span>
                <div style={{ 
                  display: 'flex', 
                  gap: '2px',
                  flex: 1
                }}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      style={{
                        height: '4px',
                        flex: 1,
                        backgroundColor: level <= passwordStrength.score 
                          ? passwordStrength.score >= 5 ? '#4CAF50' 
                          : passwordStrength.score >= 3 ? '#FF9800' 
                          : '#f44336'
                          : '#e0e0e0',
                        borderRadius: '2px'
                      }}
                    />
                  ))}
                </div>
                <span style={{ 
                  fontSize: '0.8rem',
                  color: passwordStrength.score >= 5 ? '#4CAF50' 
                        : passwordStrength.score >= 3 ? '#FF9800' 
                        : '#f44336'
                }}>
                  {passwordStrength.score >= 5 ? 'Strong' 
                   : passwordStrength.score >= 3 ? 'Medium' 
                   : 'Weak'}
                </span>
              </div>
              {passwordStrength.feedback.length > 0 && (
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {passwordStrength.feedback.map((feedback, index) => (
                    <div key={index} style={{ marginBottom: '2px' }}>
                      {feedback}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="audio" className="form-label">
            Audio File *
          </label>
          <input
            type="file"
            id="audio"
            name="audio"
            className="form-input form-file"
            onChange={handleFileChange}
            accept="audio/*"
            required
          />
          <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
            Supported formats: MP3, WAV, OGG, M4A (Max: 50MB)
          </small>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload Audio'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadForm;
