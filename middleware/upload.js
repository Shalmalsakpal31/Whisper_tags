const multer = require('multer');
const config = require('../config');

// Configure multer to use memory storage (we'll upload to GridFS after)
const storage = multer.memoryStorage();

// File filter for audio files only
const fileFilter = (req, file, cb) => {
  console.log(`File upload attempt: ${file.originalname}, MIME: ${file.mimetype}`);
  if (config.ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.log(`File rejected: ${file.originalname} (${file.mimetype})`);
    cb(new Error('Only audio files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.MAX_FILE_SIZE
  },
  fileFilter: fileFilter
});

module.exports = upload;
