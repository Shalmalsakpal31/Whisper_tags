const mongoose = require('mongoose');

let gridFSBucket;

// Initialize GridFS using mongoose's connection
const initGridFS = () => {
  const conn = mongoose.connection;
  const db = conn.db;
  
  // Access GridFSBucket from mongoose's bundled mongodb driver
  // mongoose bundles mongodb@5.9.2 which uses BSON 5.5.1 (compatible with mongoose 7.x)
  // Node.js will resolve 'mongodb' from mongoose's node_modules
  const mongodb = require('mongodb');
  
  gridFSBucket = new mongodb.GridFSBucket(db, {
    bucketName: 'audioFiles'
  });
  return gridFSBucket;
};

// Get GridFS bucket instance
const getGridFS = () => {
  if (!gridFSBucket) {
    return initGridFS();
  }
  return gridFSBucket;
};

// Upload file to GridFS
const uploadToGridFS = (fileBuffer, filename, metadata = {}) => {
  return new Promise((resolve, reject) => {
    const bucket = getGridFS();
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: metadata
    });

    uploadStream.on('error', (error) => {
      reject(error);
    });

    uploadStream.on('finish', () => {
      resolve({
        fileId: uploadStream.id,
        filename: uploadStream.filename,
        length: uploadStream.length
      });
    });

    uploadStream.end(fileBuffer);
  });
};

// Helper to convert to ObjectId - use mongoose's ObjectId to ensure BSON compatibility
const toObjectId = (id) => {
  // If already an ObjectId, return as is
  if (id instanceof mongoose.Types.ObjectId) {
    return id;
  }
  // Convert string to mongoose ObjectId (uses correct BSON version)
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (error) {
    throw new Error(`Invalid ObjectId: ${id}`);
  }
};

// Download file from GridFS
const downloadFromGridFS = (fileId) => {
  return new Promise((resolve, reject) => {
    const bucket = getGridFS();
    const downloadStream = bucket.openDownloadStream(toObjectId(fileId));

    const chunks = [];
    
    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    downloadStream.on('error', (error) => {
      reject(error);
    });

    downloadStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
};

// Get file info from GridFS
const getFileInfo = async (fileId) => {
  try {
    const bucket = getGridFS();
    const files = await bucket.find({ _id: toObjectId(fileId) }).toArray();
    
    if (files.length === 0) {
      return null;
    }
    
    return files[0];
  } catch (error) {
    throw error;
  }
};

// Delete file from GridFS
const deleteFromGridFS = async (fileId) => {
  try {
    // First check if file exists
    const fileInfo = await getFileInfo(fileId);
    if (!fileInfo) {
      // File doesn't exist, but that's okay - just return success
      console.log(`File ${fileId} not found in GridFS, skipping deletion`);
      return;
    }
    
    // File exists, proceed with deletion
    const bucket = getGridFS();
    return new Promise((resolve, reject) => {
      bucket.delete(toObjectId(fileId), (error) => {
        if (error) {
          // If it's a "file not found" or "MongoRuntimeError" error, that's okay
          const errorMessage = error.message || '';
          const errorName = error.name || '';
          if (errorMessage.includes('File not found') || 
              errorName === 'MongoRuntimeError' ||
              errorMessage.includes('MongoRuntimeError')) {
            console.log(`File ${fileId} not found in GridFS, skipping deletion`);
            resolve();
          } else {
            reject(error);
          }
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    // If getFileInfo fails or file doesn't exist, that's okay
    const errorMessage = error.message || '';
    const errorName = error.name || '';
    if (errorMessage.includes('File not found') || 
        errorName === 'MongoRuntimeError' ||
        errorMessage.includes('MongoRuntimeError')) {
      console.log(`File ${fileId} not found in GridFS, skipping deletion`);
      return;
    }
    throw error;
  }
};

// Create read stream for GridFS file (for streaming)
const createReadStream = (fileId, options = {}) => {
  const bucket = getGridFS();
  return bucket.openDownloadStream(toObjectId(fileId), options);
};

module.exports = {
  initGridFS,
  getGridFS,
  uploadToGridFS,
  downloadFromGridFS,
  getFileInfo,
  deleteFromGridFS,
  createReadStream
};

