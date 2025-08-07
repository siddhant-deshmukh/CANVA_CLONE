const mongoose = require("mongoose");

const TemplateSchema = new mongoose.Schema({
  userId: String,
  name: String,
  canvasData: String,
  width: Number,
  height: Number,
  category: String,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

const Template = mongoose.models.Template || mongoose.model("Template", TemplateSchema);
module.exports = Template;
