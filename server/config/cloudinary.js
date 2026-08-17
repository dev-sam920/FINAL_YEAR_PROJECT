import 'dotenv/config';
import multer from 'multer';
import FormData from 'form-data';
import axios from 'axios';

// NOTE: This file used to contain Cloudinary integration and local fallback
// logic. Cloudinary connectivity is blocked in some environments. We now
// upload images to ImgBB and remove local ephemeral storage fallback.

const buildFileName = (file) => {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const extension = file?.originalname?.split('.').pop() || 'bin';
  return `${file.fieldname || 'file'}-${uniqueSuffix}.${extension}`;
};

const createImgBBStorage = (fieldNameToFolder) => ({
  _handleFile(req, file, cb) {
    const chunks = [];
    file.stream.on('data', (c) => chunks.push(c));
    file.stream.on('error', (err) => cb(err));
    file.stream.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString('base64');
        const apiKey = process.env.IMGBB_API_KEY;

        if (!apiKey) {
          console.warn('[ImgBB] IMGBB_API_KEY not set; skipping remote upload');
          // Continue without a remote URL — caller should handle missing photo.
          return cb(null, file);
        }

        const url = `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`;
        const form = new FormData();
        form.append('image', base64);
        form.append('name', buildFileName(file));

        const response = await axios.post(url, form, {
          headers: form.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: Number(process.env.IMGBB_UPLOAD_TIMEOUT_MS || 20000),
        });

        const imgUrl = response?.data?.data?.url;
        if (imgUrl) {
          file.path = imgUrl;
          file.url = imgUrl;
          file.filename = response?.data?.data?.id || buildFileName(file);
        } else {
          console.warn('[ImgBB] upload succeeded but response missing URL', response?.data);
        }

        return cb(null, file);
      } catch (err) {
        console.error('[ImgBB] upload failed', err?.message || err);
        // Graceful: continue without photo rather than crashing the request
        return cb(null, file);
      }
    });
  },

  _removeFile(_req, _file, cb) {
    cb(null);
  },
});

export const createUploadMiddleware = ({
  fieldNameToFolder,
  allowedMimeTypes,
  fileSize = 4 * 1024 * 1024,
  errorMessage = 'Unsupported file type',
} = {}) => {
  const storage = createImgBBStorage(fieldNameToFolder || {});

  const normalizeMimeTypes = (file) => {
    if (Array.isArray(allowedMimeTypes)) return allowedMimeTypes;
    if (allowedMimeTypes && typeof allowedMimeTypes === 'object') return allowedMimeTypes[file.fieldname] || allowedMimeTypes.default || [];
    return [];
  };

  return multer({
    storage,
    limits: { fileSize },
    fileFilter: (req, file, cb) => {
      const mimeTypes = normalizeMimeTypes(file);
      if (mimeTypes.length === 0 || mimeTypes.includes(file.mimetype)) {
        cb(null, true);
        return;
      }

      cb(new Error(errorMessage));
    },
  });
};

export const getUploadedAssetUrl = (file, fallbackValue = null) => {
  if (!file) return fallbackValue || null;
  if (typeof file === 'string') return file;
  if (file.url) return file.url;
  if (file.path && typeof file.path === 'string') return file.path;
  if (file.filename) return file.filename;
  return fallbackValue || null;
};
