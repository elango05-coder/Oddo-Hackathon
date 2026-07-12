const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { BadRequestError } = require('../utils/errors');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|webp/;
  const allowedDocTypes = /pdf|doc|docx|csv|xls|xlsx/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  const isImage = allowedImageTypes.test(extname) && mimetype.startsWith('image/');
  const isDoc = allowedDocTypes.test(extname) || 
                mimetype === 'application/pdf' || 
                mimetype === 'application/msword' ||
                mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                mimetype === 'text/csv' ||
                mimetype === 'application/vnd.ms-excel' ||
                mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  if (isImage || isDoc) {
    return cb(null, true);
  }
  
  cb(new BadRequestError('Only images (jpeg, jpg, png, webp) and documents (pdf, doc, docx, csv, xls, xlsx) are allowed!'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

module.exports = upload;
