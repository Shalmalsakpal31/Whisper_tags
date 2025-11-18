const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config');
const adminRoutes = require('./routes/admin');
const audioRoutes = require('./routes/audio');

const app = express();

// Security middleware (allow cross-origin resource loading for media)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
// In development: allow localhost:3000 (React dev server)
// In production: allow the configured CLIENT_ORIGIN (e.g. your Vercel frontend URL)
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? config.CLIENT_ORIGIN
    : ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Note: Audio files are now stored in MongoDB GridFS, not in the filesystem

// Serve favicon.ico to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content response
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ msg: 'Server is running!', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/admin', adminRoutes);
app.use('/api/audio', audioRoutes);

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
} else {
  // In development, handle React routes by redirecting to React dev server
  app.get('*', (req, res) => {
    // Don't redirect API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ msg: 'Route not found' });
    }
    // Redirect to React dev server for frontend routes
    res.redirect(`http://localhost:3000${req.path}`);
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ msg: 'File too large' });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ msg: 'Unexpected file field' });
  }
  
  res.status(500).json({ msg: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ msg: 'Route not found' });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Initialize GridFS
    const { initGridFS } = require('./utils/gridfs');
    initGridFS();
    console.log('GridFS initialized for audio file storage');

    app.listen(config.PORT, () => {
      console.log(`Server running on port ${config.PORT}`);
      console.log(`Admin access: http://localhost:${config.PORT}`);
      console.log('Audio files are now stored in MongoDB GridFS');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
