const parseOrigins = (origins) => {
  if (!origins) return [];
  return origins
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
};

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/audio_website',
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',

  // Backend CORS configuration
  // In production (e.g. Vercel frontend), set CLIENT_ORIGINS to a comma-separated list of allowed frontend URLs
  // Example: https://your-vercel-app.vercel.app,https://your-preview.vercel.app
  CLIENT_ORIGINS: parseOrigins(process.env.CLIENT_ORIGINS) || [],
  DEFAULT_DEV_ORIGINS: ['http://localhost:3000'],

  // Legacy filesystem settings (no longer used for new uploads, kept for backwards compatibility)
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads/audio',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 50000000, // 50MB
  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/m4a', 'text/plain']
};
