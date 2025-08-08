const mongoose = require("mongoose");

const mediaCategoryMappingSchema = new mongoose.Schema({
  mediaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Media",
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ImageCategory",
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MediaCategoryMapping =
  mongoose.models.MediaCategoryMapping || mongoose.model("MediaCategoryMapping", mediaCategoryMappingSchema);

module.exports = MediaCategoryMapping;
