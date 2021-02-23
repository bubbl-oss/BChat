const cloudinary = require('cloudinary').v2;
const path = require('path');

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_DB_FOLDER_NAME,
} = process.env;

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME.trim(),
  api_key: CLOUDINARY_API_KEY.trim(),
  api_secret: CLOUDINARY_API_SECRET.trim(),
});

function upload(filepath) {
  return cloudinary.uploader.upload(filepath, {
    public_id: `${CLOUDINARY_DB_FOLDER_NAME.trim()}/${path.basename(filepath)}`,
    resource_type: 'raw',
    invalidate: true,
    overwrite: true,
    // use_filename: true,
  });
}

function url(public_id) {
  return cloudinary.utils.url(public_id);
}

module.exports = {
  cloudinary,
  upload,
  url,
};
