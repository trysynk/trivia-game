const cloudinary = require('../config/cloudinary');
const { Media } = require('../models');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const uploadToCloudinary = async (file, options = {}) => {
  const {
    folder = 'trivia',
    resourceType = 'auto',
    transformation = null
  } = options;

  const uploadOptions = {
    folder,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true
  };

  if (transformation) {
    uploadOptions.transformation = transformation;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
};

const processImage = async (buffer, options = {}) => {
  const {
    width = 800,
    height = null,
    quality = 80,
    format = 'webp'
  } = options;

  let transformer = sharp(buffer);

  if (width || height) {
    transformer = transformer.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  transformer = transformer.toFormat(format, { quality });

  return transformer.toBuffer();
};

const createThumbnail = async (buffer, options = {}) => {
  const {
    width = 200,
    height = 200,
    quality = 70
  } = options;

  return sharp(buffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center'
    })
    .toFormat('webp', { quality })
    .toBuffer();
};

const uploadMedia = async (file, uploadedBy, options = {}) => {
  const { processImages = true, createThumb = true } = options;

  let buffer = file.buffer;
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');
  const isAudio = file.mimetype.startsWith('audio/');

  let dimensions = null;
  let thumbnailResult = null;

  // Process image if needed
  if (isImage && processImages) {
    buffer = await processImage(buffer);
    const metadata = await sharp(buffer).metadata();
    dimensions = {
      width: metadata.width,
      height: metadata.height
    };

    // Create and upload thumbnail
    if (createThumb) {
      const thumbBuffer = await createThumbnail(file.buffer);
      thumbnailResult = await uploadToCloudinary(
        { buffer: thumbBuffer },
        { folder: 'trivia/thumbnails' }
      );
    }
  }

  // Determine resource type
  let resourceType = 'auto';
  if (isVideo) resourceType = 'video';
  if (isAudio) resourceType = 'video'; // Cloudinary uses video for audio

  // Upload main file
  const result = await uploadToCloudinary(
    { buffer },
    {
      folder: `trivia/${isImage ? 'images' : isVideo ? 'videos' : 'audio'}`,
      resourceType
    }
  );

  // Determine media type
  let type = 'document';
  if (isImage) type = 'image';
  else if (isVideo) type = 'video';
  else if (isAudio) type = 'audio';

  // Create media record
  const media = await Media.create({
    filename: result.public_id,
    originalName: file.originalname,
    mimeType: file.mimetype,
    type,
    url: result.secure_url,
    path: result.public_id,
    size: result.bytes,
    dimensions,
    duration: result.duration || null,
    thumbnailUrl: thumbnailResult?.secure_url || null,
    uploadedBy
  });

  return media;
};

const deleteMedia = async (mediaId) => {
  const media = await Media.findById(mediaId);

  if (!media) {
    throw new Error('Media not found');
  }

  // Delete from Cloudinary
  try {
    const resourceType = media.type === 'image' ? 'image' : 'video';
    await cloudinary.uploader.destroy(media.path, { resource_type: resourceType });

    // Delete thumbnail if exists
    if (media.thumbnailUrl) {
      const thumbPath = media.thumbnailUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`trivia/thumbnails/${thumbPath}`);
    }
  } catch (error) {
    console.error('Failed to delete from Cloudinary:', error.message);
  }

  // Delete record
  await Media.findByIdAndDelete(mediaId);

  return media;
};

const getMedia = async (options = {}) => {
  const {
    page = 1,
    limit = 20,
    type,
    uploadedBy,
    search
  } = options;

  const query = {};

  if (type) query.type = type;
  if (uploadedBy) query.uploadedBy = uploadedBy;
  if (search) {
    query.originalName = { $regex: search, $options: 'i' };
  }

  const skip = (page - 1) * limit;

  const [media, total] = await Promise.all([
    Media.find(query)
      .populate('uploadedBy', 'username displayName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Media.countDocuments(query)
  ]);

  return {
    media,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

const getMediaById = async (mediaId) => {
  return Media.findById(mediaId)
    .populate('uploadedBy', 'username displayName')
    .populate('usedInQuestions');
};

const linkMediaToQuestion = async (mediaId, questionId) => {
  return Media.findByIdAndUpdate(
    mediaId,
    {
      $addToSet: { usedInQuestions: questionId },
      $inc: { usageCount: 1 }
    },
    { new: true }
  );
};

const unlinkMediaFromQuestion = async (mediaId, questionId) => {
  return Media.findByIdAndUpdate(
    mediaId,
    {
      $pull: { usedInQuestions: questionId },
      $inc: { usageCount: -1 }
    },
    { new: true }
  );
};

const getUnusedMedia = async (days = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return Media.find({
    usageCount: 0,
    createdAt: { $lt: cutoffDate }
  }).sort({ createdAt: 1 });
};

const cleanupUnusedMedia = async (days = 30) => {
  const unusedMedia = await getUnusedMedia(days);
  const deleted = [];

  for (const media of unusedMedia) {
    try {
      await deleteMedia(media._id);
      deleted.push(media._id);
    } catch (error) {
      console.error(`Failed to delete media ${media._id}:`, error.message);
    }
  }

  return { deletedCount: deleted.length, deletedIds: deleted };
};

module.exports = {
  uploadToCloudinary,
  processImage,
  createThumbnail,
  uploadMedia,
  deleteMedia,
  getMedia,
  getMediaById,
  linkMediaToQuestion,
  unlinkMediaFromQuestion,
  getUnusedMedia,
  cleanupUnusedMedia
};
