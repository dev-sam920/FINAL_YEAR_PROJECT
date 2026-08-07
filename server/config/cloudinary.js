import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

let cloudinary;
let cloudinaryConfigured = false;
let cloudinaryConfig = {};

export const getCloudinaryConfig = (env = process.env) => {
  const config = {
    cloud_name: env.CLOUDINARY_CLOUD_NAME?.trim() || '',
    api_key: env.CLOUDINARY_API_KEY?.trim() || '',
    api_secret: env.CLOUDINARY_API_SECRET?.trim() || '',
    upload_preset: env.CLOUDINARY_UPLOAD_PRESET?.trim() || '',
  };

  return {
    ...config,
    configured: Boolean(config.cloud_name && config.api_key && config.api_secret),
  };
};

try {
  const cloudinaryModule = await import('cloudinary');

  cloudinary = cloudinaryModule.v2;
  cloudinaryConfig = getCloudinaryConfig();

  cloudinary.config({
    cloud_name: cloudinaryConfig.cloud_name,
    api_key: cloudinaryConfig.api_key,
    api_secret: cloudinaryConfig.api_secret,
  });

  cloudinaryConfigured = cloudinaryConfig.configured;

  console.log('[Cloudinary] config loaded', {
    cloud_name: cloudinaryConfig.cloud_name || null,
    api_key: cloudinaryConfig.api_key || null,
    api_secret: Boolean(cloudinaryConfig.api_secret),
    upload_preset: cloudinaryConfig.upload_preset || null,
  });
} catch (error) {
  cloudinaryConfigured = false;
  console.warn('Cloudinary storage is not available. Falling back to local uploads.', error.message);
}

const getLocalDestination = (folderName) => {
  const targetFolder = path.resolve('uploads', folderName);
  fs.mkdirSync(targetFolder, { recursive: true });
  return targetFolder;
};

const getPublicAssetUrl = (assetPath, req = null) => {
  if (typeof assetPath !== 'string') {
    return assetPath;
  }

  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }

  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;

  if (!normalizedPath.startsWith('/uploads/')) {
    return normalizedPath;
  }

  if (req?.protocol && req.get?.('host')) {
    return `${req.protocol}://${req.get('host')}${normalizedPath}`;
  }

  const configuredBaseUrl = process.env.APP_URL || process.env.SERVER_URL || '';
  if (configuredBaseUrl) {
    return `${configuredBaseUrl}${normalizedPath}`;
  }

  const port = process.env.PORT || '5000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = process.env.HOST || 'localhost';
  return `${protocol}://${host}:${port}${normalizedPath}`;
};

const buildFileName = (file) => {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const extension = path.extname(file.originalname) || '.bin';
  return `${file.fieldname}-${uniqueSuffix}${extension}`;
};

const writeFileToLocalStorage = (file, folderName, req, cb) => {
  const targetDirectory = getLocalDestination(folderName);
  const targetFileName = buildFileName(file);
  const targetPath = path.join(targetDirectory, targetFileName);
  const writeStream = fs.createWriteStream(targetPath);

  writeStream.on('error', (error) => cb(error));
  writeStream.on('finish', () => {
    const publicPath = `/uploads/${folderName}/${targetFileName}`;
    file.path = getPublicAssetUrl(publicPath, req);
    file.url = file.path;
    file.filename = targetFileName;
    file.localPath = targetPath;
    cb(null, file);
  });

  file.stream.pipe(writeStream);
};

const createCloudinaryStorage = (fieldNameToFolder) => ({
  _handleFile(req, file, cb) {
    const folderName = fieldNameToFolder?.[file.fieldname] || fieldNameToFolder?.default || 'uploads';
    const isDocument = file.mimetype.startsWith('application/');
    const publicId = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const uploadOptions = {
      folder: `smartmaint/${folderName}`,
      resource_type: isDocument ? 'auto' : 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
      public_id: publicId,
    };

    if (cloudinaryConfig.upload_preset) {
      uploadOptions.upload_preset = cloudinaryConfig.upload_preset;
    }

    console.log('[Cloudinary] config before upload', cloudinary.config());
    console.log('[Cloudinary] uploading file', {
      cloud_name: cloudinaryConfig.cloud_name || null,
      api_key: cloudinaryConfig.api_key || null,
      upload_preset: cloudinaryConfig.upload_preset || null,
      folder: uploadOptions.folder,
      public_id: uploadOptions.public_id,
      resource_type: uploadOptions.resource_type,
    });

    if (!cloudinary?.uploader?.upload_stream) {
      return writeFileToLocalStorage(file, folderName, req, cb);
    }

    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        console.error('Cloudinary error:', error);
        console.warn('[Cloudinary] falling back to local storage for upload');
        return writeFileToLocalStorage(file, folderName, req, cb);
      }

      file.path = result.secure_url || result.url;
      file.filename = result.public_id;
      file.cloudinary = result;
      cb(null, file);
    });

    file.stream.pipe(uploadStream);
  },

  _removeFile(req, file, cb) {
    cb(null);
  },
});

export const createUploadMiddleware = ({
  fieldNameToFolder,
  allowedMimeTypes,
  fileSize = 4 * 1024 * 1024,
  errorMessage = 'Unsupported file type',
}) => {
  const storage = cloudinaryConfigured && cloudinary
    ? createCloudinaryStorage(fieldNameToFolder)
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
    const publicUrl = getPublicAssetUrl(file.path);

    if (/^https?:\/\//i.test(publicUrl)) {
      return publicUrl;
    }

    if (publicUrl.startsWith('/uploads/')) {
      return publicUrl;
    }

    return fallbackValue || null;
  }

  if (file.filename) {
    return fallbackValue || `/uploads/${file.filename}`;
  }

  return fallbackValue || null;
};
