import multer from "multer";
import path from "path";
import fs from "fs";

// Define allowed file types
const imageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  "image/x-icon",
];

const videoTypes = [
  "video/mp4",
  "video/mpeg",
  "video/ogg",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-ms-wmv",
  "video/3gpp",
  "application/octet-stream",
];

const docTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/rtf",
  "application/vnd.oasis.opendocument.text",
];

// Dynamic storage destination based on file type
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;

    if (imageTypes.includes(file.mimetype)) {
      uploadPath = "uploads/images";
    } else if (videoTypes.includes(file.mimetype)) {
      uploadPath = "uploads/videos";
    } else if (docTypes.includes(file.mimetype)) {
      uploadPath = "uploads/documents";
    } else {
      return cb(new Error("Invalid file type"), false);
    }

    // Create directory if not exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${Date.now()}${ext}`);
  },
});

// File filter for additional safety
const fileFilter = (req, file, cb) => {
  if (
    imageTypes.includes(file.mimetype) ||
    videoTypes.includes(file.mimetype) ||
    docTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type for " + file.fieldname), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

export default upload;
