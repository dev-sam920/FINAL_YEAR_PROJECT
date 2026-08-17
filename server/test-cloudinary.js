import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: '432241938564531',
  api_secret: 'sRiRb6jlI5kZJTpcmICmovwSshc'
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