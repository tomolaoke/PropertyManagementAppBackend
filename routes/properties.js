const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const propertyController = require('../controllers/propertyController');

// Set up Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
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
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png) and PDFs are allowed'));
  }
});

// Routes
router.post('/', protect, upload.fields([
  { name: 'utility_bill', maxCount: 1 },
  { name: 'photos', maxCount: 10 }
]), propertyController.createProperty);
router.get('/', protect, propertyController.getProperties);
router.get('/:id', protect, propertyController.getProperty);
router.put('/:id', protect, upload.fields([
  { name: 'utility_bill', maxCount: 1 },
  { name: 'photos', maxCount: 10 }
]), propertyController.updateProperty);
router.delete('/:id', protect, propertyController.deleteProperty);

module.exports = router;