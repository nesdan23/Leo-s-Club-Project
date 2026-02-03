const multer = require('multer');

// Configure multer for memory storage (no disk storage needed)
const storage = multer.memoryStorage();

// File filter to only accept .xlsx files
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only Excel files (.xlsx) are allowed.'
      ),
      false
    );
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Middleware for single file upload with field name 'file'
const uploadExcel = upload.single('file');

module.exports = uploadExcel;
