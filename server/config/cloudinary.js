import fs from 'fs';
import path from 'path';
import multer from 'multer';

let cloudinary;
let CloudinaryStorage;
let cloudinaryConfigured = false;

try {
  const cloudinaryModule = await import('cloudinary');
  const storageModule = await import('multer-storage-cloudinary');

  cloudinary = cloudinaryModule.v2;
  CloudinaryStorage = storageModule.CloudinaryStorage;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  cloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
} catch (error) {
  cloudinaryConfigured = false;
  console.warn('Cloudinary storage is not available. Falling back to local uploads.', error.message);
}

const getLocalDestination = (folderName) => {
  const targetFolder = path.resolve('uploads', folderName);
  fs.mkdirSync(targetFolder, { recursive: true });
  return targetFolder;
};

const buildFileName = (file) => {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const extension = path.extname(file.originalname) || '.bin';
  return `${file.fieldname}-${uniqueSuffix}${extension}`;
};

export const createUploadMiddleware = ({
  fieldNameToFolder,
  allowedMimeTypes,
  fileSize = 5 * 1024 * 1024,
  errorMessage = 'Unsupported file type',
}) => {
  const storage = cloudinaryConfigured && cloudinary && CloudinaryStorage
    ? new CloudinaryStorage({
        cloudinary,
        params: async (req, file) => {
          const folderName = fieldNameToFolder?.[file.fieldname] || fieldNameToFolder?.default || 'uploads';
          const isDocument = file.mimetype.startsWith('application/');
          return {
            folder: `smartmaint/${folderName}`,
            resource_type: isDocument ? 'auto' : 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
            public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
          };
        },
      })
    : multer.diskStorage({
        destination: (req, file, cb) => {
          const folderName = fieldNameToFolder?.[file.fieldname] || fieldNameToFolder?.default || 'uploads';
          cb(null, getLocalDestination(folderName));
        },
        filename: (req, file, cb) => cb(null, buildFileName(file)),
      });

  const normalizeMimeTypes = (file) => {
    if (Array.isArray(allowedMimeTypes)) {
      return allowedMimeTypes;
    }

    if (allowedMimeTypes && typeof allowedMimeTypes === 'object') {
      return allowedMimeTypes[file.fieldname] || allowedMimeTypes.default || [];
    }

    return [];
  };

  return multer({
    storage,
    limits: { fileSize },
    fileFilter: (req, file, cb) => {
      const mimeTypes = normalizeMimeTypes(file);
      if (mimeTypes.includes(file.mimetype)) {
        cb(null, true);
        return;
      }

      cb(new Error(errorMessage));
    },
  });
};

export const getUploadedAssetUrl = (file, fallbackValue = null) => {
  if (!file) {
    return fallbackValue || null;
  }

  if (typeof file === 'string') {
    return file;
  }

  if (file.secure_url) {
    return file.secure_url;
  }

  if (typeof file.path === 'string') {
    if (/^https?:\/\//i.test(file.path)) {
      return file.path;
    }

    if (file.path.startsWith('/uploads/')) {
      return file.path;
    }

    return fallbackValue || null;
  }

  if (file.filename) {
    return fallbackValue || `/uploads/${file.filename}`;
  }

  return fallbackValue || null;
};
