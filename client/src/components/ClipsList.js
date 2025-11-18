import React from 'react';

const ClipsList = ({ clips, onDelete, onShare }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (clips.length === 0) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No audio clips uploaded yet</h3>
          <p>Upload your first audio clip using the form above.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">📁 Audio Clips ({clips.length})</h3>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Filename</th>
              <th>Size</th>
              <th>Access Count</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clips.map((clip) => (
              <tr key={clip._id}>
                <td>
                  <strong>{clip.title}</strong>
                </td>
                <td>
                  <code>{clip.filename}</code>
                </td>
                <td>{formatFileSize(clip.fileSize)}</td>
                <td>
                  <span style={{ 
                    color: clip.accessCount > 0 ? '#4CAF50' : '#999',
                    fontWeight: 'bold'
                  }}>
                    {clip.accessCount}
                  </span>
                </td>
                <td>{formatDate(clip.createdAt)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => onShare(clip._id)}
                      className="btn btn-secondary btn-small"
                      title="Copy share link"
                    >
                      📤 Share
                    </button>
                    <button
                      onClick={() => onDelete(clip._id)}
                      className="btn btn-danger btn-small"
                      title="Delete clip"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClipsList;
