const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const leaseController = require('../controllers/leaseController');

// Set up Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../Uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only PDFs are allowed for lease documents'));
  }
});

// Routes
router.post('/', protect, upload.single('document'), leaseController.createLease);
router.get('/', protect, leaseController.getLeases);
router.get('/:id', protect, leaseController.getLease);
router.put('/:id', protect, upload.single('document'), leaseController.updateLease);
router.delete('/:id', protect, leaseController.deleteLease);

module.exports = router;