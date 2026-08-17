import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Config:', cloudinary.config());

cloudinary.uploader.upload(
  'https://res.cloudinary.com/demo/image/upload/sample.jpg',
  { folder: 'smartmaint/test' },
  (error, result) => {
    if (error) {
      console.error('❌ UPLOAD FAILED:', error);
    } else {
      console.log('✅ UPLOAD SUCCESS:', result.secure_url);
    }
  }
);