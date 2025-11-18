# 🎵 Audio Website - Secure Audio Clip Management

A secure local website for managing password-protected audio clips with MongoDB storage.

## Features

- **Admin Dashboard**: Upload and manage audio clips with custom passwords
- **Password Protection**: Each audio clip requires a password to access
- **Secure Storage**: Audio files stored locally, metadata in MongoDB
- **User Access**: Share links for users to access specific audio clips
- **Modern UI**: Clean, responsive interface built with React

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas)
- npm or yarn

## Installation

### 1. Clone and Setup

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/audio_website
JWT_SECRET=your_jwt_secret_key_here
ADMIN_PASSWORD=admin123
UPLOAD_PATH=./uploads/audio
MAX_FILE_SIZE=50000000
```

### 3. MongoDB Setup

Make sure MongoDB is running:
- **Local MongoDB**: Start MongoDB service
- **MongoDB Atlas**: Use your connection string in `.env`

### 4. Start the Application

```bash
# Option 1: Start both servers together (recommended)
npm run dev

# Option 2: Use the startup scripts
# Windows Batch:
start.bat

# Windows PowerShell:
start.ps1

# Option 3: Start separately in different terminals:
# Terminal 1 - Backend:
npm start

# Terminal 2 - Frontend:
npm run client
```

## Usage

### Admin Access

1. Navigate to `http://localhost:3000/admin`
2. Login with the password from your `.env` file (default: `admin123`)
3. Upload audio clips with custom titles and passwords
4. Copy share links for users

### User Access

1. Use the shared link: `http://localhost:3000/audio/{clip-id}`
2. Enter the password provided by admin
3. Play the audio clip

## API Endpoints

### Admin Routes
- `POST /api/admin/login` - Admin login
- `POST /api/admin/upload` - Upload audio clip
- `GET /api/admin/clips` - Get all clips
- `DELETE /api/admin/clips/:id` - Delete clip
- `GET /api/admin/clips/:id/share` - Get share link

### Audio Routes
- `GET /api/audio/:id` - Get clip info
- `POST /api/audio/verify/:id` - Verify password
- `GET /api/audio/stream/:id` - Stream audio file

## File Structure

```
audio-website/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   └── App.js
│   └── package.json
├── models/                 # MongoDB models
├── routes/                 # Express routes
├── middleware/             # Custom middleware
├── uploads/               # Audio file storage
├── config.js              # Configuration
├── server.js              # Express server
└── package.json
```

## Security Features

- Password hashing with bcrypt
- JWT authentication for admin
- File type validation
- Rate limiting
- Helmet security headers
- CORS protection

## Production Deployment

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Set environment variables for production
3. Use PM2 or similar for process management
4. Configure reverse proxy (nginx)

## Supported Audio Formats

- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)
- M4A (.m4a)

## Configuration Options

- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 50MB)
- `ALLOWED_AUDIO_TYPES`: Array of allowed MIME types
- `UPLOAD_PATH`: Directory for storing audio files

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **"Route not found" Error**
   - Make sure both backend (port 5000) and frontend (port 3000) are running
   - Use `npm run dev` to start both servers together
   - Check that you're accessing the frontend at `http://localhost:3000`
   - API endpoints should be accessed via `http://localhost:5000/api/`

3. **"Cannot find module" Errors**
   - Run `npm install` in the root directory
   - Run `npm install` in the client directory
   - Or use `npm run install-all` to install both

4. **File Upload Fails**
   - Check file size limits
   - Verify file format is supported
   - Ensure upload directory exists

5. **Frontend Not Loading**
   - Run `npm run client` in client directory
   - Check if backend is running on port 5000
   - Ensure no port conflicts

### Quick Test

Test if the servers are working:
```bash
# Test backend
curl http://localhost:5000/api/test

# Should return: {"msg":"Server is running!","timestamp":"..."}

# Test frontend
# Open http://localhost:3000 in browser
```

### Logs

Check console output for detailed error messages. Server logs include:
- Database connection status
- File upload progress
- Authentication attempts
- API request/response details

## License

MIT License - feel free to modify and distribute.
