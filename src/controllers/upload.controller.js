const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const { asyncHandler, createError } = require('../utils/helpers');

const uploadToCloudinary = async (filePath, folder, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `trivia-game/${folder}`,
      resource_type: resourceType
    });

    fs.unlinkSync(filePath);

    return result.secure_url;
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError('No file uploaded', 400);
  }

  const url = await uploadToCloudinary(req.file.path, 'images', 'image');

  res.json({ url });
});

const uploadAudio = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError('No file uploaded', 400);
  }

  const url = await uploadToCloudinary(req.file.path, 'audio', 'video');

  res.json({ url });
});

const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError('No file uploaded', 400);
  }

  const url = await uploadToCloudinary(req.file.path, 'video', 'video');

  res.json({ url });
});

const deleteFile = asyncHandler(async (req, res) => {
  const { publicId } = req.body;

  if (!publicId) {
    throw createError('Public ID is required', 400);
  }

  await cloudinary.uploader.destroy(publicId);

  res.json({ message: 'File deleted successfully' });
});

module.exports = {
  uploadImage,
  uploadAudio,
  uploadVideo,
  deleteFile
};
