const Template = require("../models/template");

exports.getUserTemplates = async (req, res) => {
  try {
    const userId = req.user.userId;

    const templates = await Template.find({ userId }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (e) {
    console.error("Error fetching templates", e);
    res.status(500).json({
      success: false,
      message: "Failed to fetch templates",
    });
  }
};

exports.getUserTemplatesByID = async (req, res) => {
  try {
    const userId = req.user.userId;
    const templateId = req.params.id;

    const template = await Template.findOne({ _id: templateId, userId });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found! or you don't have permission to view it.",
      });
    }

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (e) {
    console.error("Error fetching template by ID", e);
    res.status(500).json({
      success: false,
      message: "Failed to fetch template by ID",
    });
  }
};

exports.saveTemplate = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { templateId, name, canvasData, width, height, category } = req.body;
    if (templateId) {
      const template = await Template.findOne({ _id: templateId, userId });
      if (!template) {
        return res.status(404).json({
          success: false,
          message: "Template not found! or you don't have permission to view it.",
        });
      }

      if (name) template.name = name;
      if (canvasData) template.canvasData = canvasData;
      if (width) template.width = width;
      if (height) template.height = height;
      if (category) template.category = category;

      template.updatedAt = Date.now();
      const updatedTemplate = await template.save();

      return res.status(200).json({
        success: true,
        data: updatedTemplate,
      });
    } else {
      const newTemplate = new Template({
        userId,
        name: name || "Untitled Template",
        width,
        height,
        canvasData,
        category,
      });

      const saveTemplate = await newTemplate.save();
      return res.status(200).json({
        success: true,
        data: saveTemplate,
      });
    }
  } catch (e) {
    console.error("Error while saving template", e);
    res.status(500).json({
      success: false,
      message: "Failed to save template",
    });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const userId = req.user.userId;
    const templateId = req.params.id;
    const template = await Template.findOne({ _id: templateId, userId });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found! or you don't have permission to delete it.",
      });
    }

    await Template.deleteOne({ _id: templateId });

    res.status(200).json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (e) {
    console.error("Error while deleting template", e);
    res.status(500).json({
      success: false,
      message: "Failed to delete template",
    });
  }
};
