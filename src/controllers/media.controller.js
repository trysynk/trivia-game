const { mediaService, activityService } = require('../services');
const { asyncHandler, createError } = require('../utils/helpers');

const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError('No file uploaded', 400);
  }

  const media = await mediaService.uploadMedia(req.file, req.admin._id, {
    processImages: req.body.processImages !== 'false',
    createThumb: req.body.createThumb !== 'false'
  });

  await activityService.logMediaUpload(req.admin, media, req);

  res.status(201).json({ media });
});

const uploadMultiple = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw createError('No files uploaded', 400);
  }

  const results = [];
  const errors = [];

  for (const file of req.files) {
    try {
      const media = await mediaService.uploadMedia(file, req.admin._id);
      results.push(media);
      await activityService.logMediaUpload(req.admin, media, req);
    } catch (error) {
      errors.push({ filename: file.originalname, error: error.message });
    }
  }

  res.status(201).json({
    uploaded: results,
    errors,
    totalUploaded: results.length,
    totalErrors: errors.length
  });
});

const getMedia = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, search } = req.query;

  const result = await mediaService.getMedia({
    page: parseInt(page),
    limit: parseInt(limit),
    type,
    search
  });

  res.json(result);
});

const getMediaById = asyncHandler(async (req, res) => {
  const media = await mediaService.getMediaById(req.params.id);

  if (!media) {
    throw createError('Media not found', 404);
  }

  res.json({ media });
});

const deleteMedia = asyncHandler(async (req, res) => {
  const media = await mediaService.getMediaById(req.params.id);

  if (!media) {
    throw createError('Media not found', 404);
  }

  await activityService.logMediaDelete(req.admin, media, req);
  await mediaService.deleteMedia(req.params.id);

  res.json({ message: 'Media deleted successfully' });
});

const bulkDelete = asyncHandler(async (req, res) => {
  const { mediaIds } = req.body;

  if (!mediaIds || !mediaIds.length) {
    throw createError('Media IDs are required', 400);
  }

  let deletedCount = 0;
  const errors = [];

  for (const id of mediaIds) {
    try {
      const media = await mediaService.getMediaById(id);
      if (media) {
        await activityService.logMediaDelete(req.admin, media, req);
        await mediaService.deleteMedia(id);
        deletedCount++;
      }
    } catch (error) {
      errors.push({ id, error: error.message });
    }
  }

  res.json({
    message: `${deletedCount} media files deleted`,
    deletedCount,
    errors
  });
});

const getUnusedMedia = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  const media = await mediaService.getUnusedMedia(parseInt(days));

  res.json({ media, count: media.length });
});

const cleanupUnused = asyncHandler(async (req, res) => {
  const { days = 30 } = req.body;

  const result = await mediaService.cleanupUnusedMedia(parseInt(days));

  res.json({
    message: `${result.deletedCount} unused media files deleted`,
    ...result
  });
});

module.exports = {
  uploadMedia,
  uploadMultiple,
  getMedia,
  getMediaById,
  deleteMedia,
  bulkDelete,
  getUnusedMedia,
  cleanupUnused
};
