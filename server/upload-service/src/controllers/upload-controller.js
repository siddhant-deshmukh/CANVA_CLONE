const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const Media = require("../models/media");
const MediaCategoryMapping = require("../models/MediaCategoryMapping");

const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No File Found!",
      });
    }

    const { originalname, mimetype, size, width, height } = req.file;
    const { userId } = req.user;

    const cloudinaryResult = await uploadMediaToCloudinary(req.file);

    const newlyCreatedMedia = new Media({
      userId,
      name: originalname,
      cloudinaryId: cloudinaryResult.public_id,
      url: cloudinaryResult.secure_url,
      mimeType: mimetype,
      size,
      width,
      height,
    });

    await newlyCreatedMedia.save();

    res.status(201).json({
      success: true,
      data: newlyCreatedMedia,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Error creating asset",
    });
  }
};

const getAllMediasByUser = async (req, res) => {
  try {
    const medias = await Media.find({ userId: req.user.userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: medias,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch assets",
    });
  }
};

const createMapping = async (req, res) => {
  const { mediaId, categoryIds } = req.body;
  const userId = req.user.userId;

  if (!mediaId || !Array.isArray(categoryIds)) {
    return res.status(400).json({ success: false, message: "Invalid payload" });
  }

  try {
    // Delete existing mappings for this media (if updating)
    await MediaCategoryMapping.deleteMany({ mediaId, userId });

    const mappings = categoryIds.map((categoryId) => ({
      mediaId,
      categoryId,
      userId,
    }));

    await MediaCategoryMapping.insertMany(mappings);

    res.status(201).json({ success: true, message: "Mappings updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error saving mappings" });
  }
};

const getAllMediasWithCategories = async (req, res) => {
  try {
    const userId = req.user.userId;

    const medias = await Media.find({ userId }).sort({ createdAt: -1 });

    const mappings = await MediaCategoryMapping.find({ userId }).populate("categoryId");
    const categoryMap = {};

    mappings.forEach((map) => {
      if (!categoryMap[map.mediaId]) categoryMap[map.mediaId] = [];
      categoryMap[map.mediaId].push(map.categoryId);
    });

    const mediaWithCategories = medias.map((media) => ({
      ...media.toObject(),
      categories: categoryMap[media._id] || [],
    }));

    res.status(200).json({ success: true, data: mediaWithCategories });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching media" });
  }
};

module.exports = { uploadMedia, getAllMediasByUser };
