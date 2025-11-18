const express = require('express');
const { body, validationResult } = require('express-validator');
const AudioClip = require('../models/AudioClip');
const { getFileInfo, createReadStream } = require('../utils/gridfs');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Get audio clip info (without password) for user page
router.get('/:id', async (req, res) => {
  try {
    const clip = await AudioClip.findById(req.params.id).select('-password');
    
    if (!clip || !clip.isActive) {
      return res.status(404).json({ msg: 'Audio clip not found' });
    }

    res.json({
      id: clip._id,
      title: clip.title,
      fileSize: clip.fileSize,
      mimeType: clip.mimeType,
      createdAt: clip.createdAt
    });
  } catch (error) {
    console.error('Get audio clip error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Verify password and get audio access
router.post('/verify/:id', [
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;
    const clip = await AudioClip.findById(req.params.id);

    if (!clip || !clip.isActive) {
      return res.status(404).json({ msg: 'Audio clip not found' });
    }

    // Check if file exists (GridFS or legacy filesystem)
    if (clip.gridFSFileId) {
      const fileInfo = await getFileInfo(clip.gridFSFileId);
      if (!fileInfo) {
        return res.status(404).json({ msg: 'Audio file not found in GridFS' });
      }
    } else if (clip.filePath) {
      // Legacy filesystem file
      if (!fs.existsSync(clip.filePath)) {
        return res.status(404).json({ msg: 'Audio file not found on filesystem' });
      }
    } else {
      return res.status(404).json({ msg: 'Audio file reference not found' });
    }

    // Verify password
    const isPasswordValid = await clip.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ msg: 'Incorrect password' });
    }

    // Update access count and last accessed time
    await clip.updateAccess();

    // Generate a temporary token for audio streaming
    const streamToken = Buffer.from(`${clip._id}-${Date.now()}-${Math.random()}`).toString('base64').replace(/[+/=]/g, '');

    // Return audio info for playback
    res.json({
      success: true,
      clip: {
        id: clip._id,
        title: clip.title,
        filename: clip.filename,
        mimeType: clip.mimeType,
        fileSize: clip.fileSize,
        accessCount: clip.accessCount + 1
      },
      streamToken
    });
  } catch (error) {
    console.error('Verify password error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Stream audio file (protected route with token verification)
router.get('/stream/:id/:token', async (req, res) => {
  try {
    const { id, token } = req.params;
    console.log(`Audio stream request: ID=${id}, Token=${token}`);
    
    const clip = await AudioClip.findById(id);

    if (!clip || !clip.isActive) {
      console.log(`Audio clip not found or inactive: ID=${id}`);
      return res.status(404).json({ msg: 'Audio clip not found' });
    }

    // Handle GridFS files
    if (clip.gridFSFileId) {
      console.log(`Audio clip found: ${clip.title}, GridFS ID: ${clip.gridFSFileId}`);

      // Get file info from GridFS
      const fileInfo = await getFileInfo(clip.gridFSFileId);
      if (!fileInfo) {
        console.log(`Audio file not found in GridFS: ${clip.gridFSFileId}`);
        return res.status(404).json({ msg: 'Audio file not found' });
      }

      console.log(`Audio file exists in GridFS, file size: ${fileInfo.length} bytes`);

      const fileSize = fileInfo.length;
      const range = req.headers.range;

      if (range) {
        // Handle range requests for audio streaming
        // Parse range header: "bytes=start-end" or "bytes=start-"
        const rangeMatch = range.match(/bytes=(\d+)-(\d*)/);
        if (!rangeMatch) {
          res.status(400).json({ msg: 'Invalid range header' });
          return;
        }
        
        const start = parseInt(rangeMatch[1], 10);
        const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        
        console.log(`Range request: ${start}-${end} of ${fileSize} (chunk size: ${chunksize})`);
        
        // Validate range
        if (isNaN(start) || isNaN(end) || start < 0 || end < start || start >= fileSize) {
          console.error(`Invalid range: start=${start}, end=${end}, fileSize=${fileSize}`);
          res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).json({ msg: 'Range Not Satisfiable' });
          return;
        }
        
        // Ensure end doesn't exceed file size
        const actualEnd = Math.min(end, fileSize - 1);
        const actualChunkSize = (actualEnd - start) + 1;
        
        console.log(`Adjusted range: ${start}-${actualEnd} (chunk size: ${actualChunkSize})`);
        
        // Create read stream with range
        const readStream = createReadStream(clip.gridFSFileId, { start, end: actualEnd });
        
        // Set headers
        res.setHeader('Content-Range', `bytes ${start}-${actualEnd}/${fileSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', actualChunkSize);
        res.setHeader('Content-Type', clip.mimeType);
        res.setHeader('Cache-Control', 'no-cache');
        res.status(206);
        
        // Handle stream events
        readStream.on('error', (error) => {
          console.error('GridFS stream error:', error);
          if (!res.headersSent) {
            res.status(500).json({ msg: 'Stream error' });
          } else {
            res.destroy();
          }
        });
        
        readStream.on('end', () => {
          console.log(`Range stream completed: ${actualChunkSize} bytes sent`);
        });
        
        // Handle client disconnect
        req.on('close', () => {
          if (!readStream.destroyed) {
            readStream.destroy();
          }
        });
        
        // Pipe stream to response (end: true ensures response closes when stream ends)
        readStream.pipe(res, { end: true });
      } else {
        // Send entire file
        console.log(`Sending entire file: ${fileSize} bytes`);
        
        const readStream = createReadStream(clip.gridFSFileId);
        
        // Set headers
        res.setHeader('Content-Length', fileSize);
        res.setHeader('Content-Type', clip.mimeType);
        res.setHeader('Accept-Ranges', 'bytes');
        res.status(200);
        
        // Handle stream events
        readStream.on('error', (error) => {
          console.error('GridFS stream error:', error);
          if (!res.headersSent) {
            res.status(500).json({ msg: 'Stream error' });
          } else {
            res.destroy();
          }
        });
        
        readStream.on('end', () => {
          console.log(`Full stream completed: ${fileSize} bytes sent`);
        });
        
        // Handle client disconnect
        req.on('close', () => {
          if (!readStream.destroyed) {
            readStream.destroy();
          }
        });
        
        // Pipe stream to response (end: true ensures response closes when stream ends)
        readStream.pipe(res, { end: true });
      }
    } 
    // Handle legacy filesystem files
    else if (clip.filePath) {
      console.log(`Audio clip found: ${clip.title}, File path: ${clip.filePath}`);

      // Check if file exists
      if (!fs.existsSync(clip.filePath)) {
        console.log(`Audio file not found on disk: ${clip.filePath}`);
        return res.status(404).json({ msg: 'Audio file not found' });
      }

      console.log(`Audio file exists, starting stream...`);

      // Get file stats
      const stat = fs.statSync(clip.filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        // Handle range requests for audio streaming
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(clip.filePath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': clip.mimeType,
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        // Send entire file
        const head = {
          'Content-Length': fileSize,
          'Content-Type': clip.mimeType,
        };
        res.writeHead(200, head);
        fs.createReadStream(clip.filePath).pipe(res);
      }
    } else {
      return res.status(404).json({ msg: 'Audio file reference not found' });
    }
  } catch (error) {
    console.error('Stream audio error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
