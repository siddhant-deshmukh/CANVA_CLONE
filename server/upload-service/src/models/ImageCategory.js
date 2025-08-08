const mongoose = require("mongoose");

const imageCategorySchema = new mongoose.Schema({
  userId: String,
  name: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ImageCategory = mongoose.models.ImageCategory || mongoose.model("ImageCategory", imageCategorySchema);
module.exports = ImageCategory;
