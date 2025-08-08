const Design = require("../models/design");
const Template = require("../models/template");
const PDFDocument = require('pdfkit');
const { createCanvas, loadImage, registerFont } = require('canvas');
const sharp = require('sharp');
const fs = require('fs');
const { default: axios } = require("axios");

exports.getUserDesigns = async (req, res) => {
  try {
    const userId = req.user.userId;

    const designs = await Design.find({ userId }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: designs,
    });
  } catch (e) {
    console.error("Error fetching designs", e);
    res.status(500).json({
      success: false,
      message: "Failed to fetch designs",
    });
  }
};

exports.getUserDesignsByID = async (req, res) => {
  try {
    const userId = req.user.userId;
    const designId = req.params.id;

    const design = await Design.findOne({ _id: designId, userId });

    if (!design) {
      return res.status(404).json({
        success: false,
        message: "Design not found! or you don't have permission to view it.",
      });
    }

    res.status(200).json({
      success: true,
      data: design,
    });
  } catch (e) {
    console.error("Error fetching design by ID", e);
    res.status(500).json({
      success: false,
      message: "Failed to fetch design by ID",
    });
  }
};

exports.saveDesign = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { designId, name, canvasData, width, height, category, templateId } = req.body;
    if (designId) {
      const design = await Design.findOne({ _id: designId, userId });
      if (!design) {
        return res.status(404).json({
          success: false,
          message: "Design not found! or you don't have permission to view it.",
        });
      }

      if (name) design.name = name;
      if (canvasData) design.canvasData = canvasData;
      if (width) design.width = width;
      if (height) design.height = height;
      if (category) design.category = category;
      if (templateId) design.templateId = templateId;

      design.updatedAt = Date.now();
      const updatedDesign = await design.save();

      return res.status(200).json({
        success: true,
        data: updatedDesign,
      });
    } else {
      const newDesign = new Design({
        userId,
        name: name || "Untitled Design",
        width,
        height,
        canvasData,
        category,
        templateId
      });

      const saveDesign = await newDesign.save();
      return res.status(200).json({
        success: true,
        data: saveDesign,
      });
    }
  } catch (e) {
    console.error("Error while saving design", e);
    res.status(500).json({
      success: false,
      message: "Failed to save design",
    });
  }
};

exports.deleteDesign = async (req, res) => {
  try {
    const userId = req.user.userId;
    const designId = req.params.id;
    const design = await Design.findOne({ _id: designId, userId });

    if (!design) {
      return res.status(404).json({
        success: false,
        message: "Design not found! or you don't have permission to delete it.",
      });
    }

    await Design.deleteOne({ _id: designId });

    res.status(200).json({
      success: true,
      message: "Design deleted successfully",
    });
  } catch (e) {
    console.error("Error while deleting design", e);
    res.status(500).json({
      success: false,
      message: "Failed to delete design",
    });
  }
};


exports.generatePrintReadyPDF = async (req, res) => {
  try {
    // Update to get designId from the request body
    const { designId, settings, templateId } = req.body;
    let { canvasData } = req.body; // Keep for now, but will be overwritten if designId is present

    if (designId) {
      // Assuming you have a Mongoose model named 'Design'
      const design = await Design.findById(designId);
      if (!design) {
        return res.status(404).json({ error: 'Design not found' });
      }
      canvasData = JSON.parse(design.canvasData);
    } else if (templateId) {
      const template = await Template.findById(templateId);
      if (!template) {
        return res.status(404).json({ error: 'template not found' });
      }
      canvasData = JSON.parse(template.canvasData);
    }

    // If canvasData is still null or undefined, return an error
    if (!canvasData) {
      return res.status(400).json({ error: 'Canvas data is missing' });
    }

    const {
      format = 'a4',
      orientation = 'landscape',
      dpi = 300,
      bleed = 3,
      margin = 5
    } = settings;

    // Get original canvas dimensions from Fabric.js (if available)
    // Default to common canvas sizes if not specified
    const originalCanvasWidth = canvasData.width || 800;
    const originalCanvasHeight = canvasData.height || 600;

    // Format dimensions in mm
    const formatOptions = {
      a4: { width: 210, height: 297 },
      a3: { width: 297, height: 420 },
      letter: { width: 216, height: 279 },
      legal: { width: 216, height: 356 }
    };

    let { width, height } = formatOptions[format];

    // Swap dimensions for landscape
    if (orientation === 'landscape') {
      [width, height] = [height, width];
    }

    // Convert mm to points (1mm = 2.834645669 points)
    const mmToPoints = 2.834645669;
    const pageWidth = width * mmToPoints;
    const pageHeight = height * mmToPoints;
    const bleedPoints = bleed * mmToPoints;
    const marginPoints = margin * mmToPoints;

    // Calculate print area (page minus margins)
    const printWidth = pageWidth - (marginPoints * 2);
    const printHeight = pageHeight - (marginPoints * 2);

    // Calculate scale to fit original canvas into print area
    const scaleX = printWidth / originalCanvasWidth;
    const scaleY = printHeight / originalCanvasHeight;
    const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio

    // Calculate final canvas size for rendering
    const renderWidth = originalCanvasWidth * scale;
    const renderHeight = originalCanvasHeight * scale;

    // Convert to pixel dimensions for high DPI
    const pixelWidth = Math.round((renderWidth / 72) * dpi);
    const pixelHeight = Math.round((renderHeight / 72) * dpi);

    // Create high-resolution canvas for rendering
    const canvas = createCanvas(pixelWidth, pixelHeight);
    const ctx = canvas.getContext('2d');

    // Scale context for high DPI and canvas scaling
    const finalScale = (dpi / 72) * scale;
    ctx.scale(finalScale, finalScale);

    // Set background color
    ctx.fillStyle = canvasData.background || '#ffffff';
    ctx.fillRect(0, 0, originalCanvasWidth, originalCanvasHeight);

    // Process fabric.js canvas data
    if (canvasData && canvasData.objects && canvasData.objects.length > 0) {
      await renderFabricObjects(ctx, canvasData.objects);
    }

    // Convert canvas to high-quality PNG buffer
    const imageBuffer = canvas.toBuffer('image/png', { compressionLevel: 0 });

    // Create PDF with embedded high-resolution image
    const doc = new PDFDocument({
      size: [pageWidth + (bleedPoints * 2), pageHeight + (bleedPoints * 2)],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title: 'Print Ready Design',
        Producer: 'High Quality PDF Generator',
        CreationDate: new Date()
      }
    });

    // Calculate position to center the canvas on the page
    const x = bleedPoints + marginPoints + (printWidth - renderWidth) / 2;
    const y = bleedPoints + marginPoints + (printHeight - renderHeight) / 2;

    // Add crop marks and bleed indicators
    addCropMarks(doc, pageWidth, pageHeight, bleedPoints);

    // Embed the rendered image at calculated position
    doc.image(imageBuffer, x, y, {
      width: renderWidth,
      height: renderHeight
    });
    await renderTextDirectlyToPDF(doc, canvasData.objects, scale, x, y);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="print-ready-${format}-${orientation}.pdf"`);

    // const filePath = 'document.pdf';
    // doc.pipe(fs.createWriteStream(filePath));

    // Pipe PDF to response
    doc.pipe(res);
    doc.end();

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
};

async function renderTextDirectlyToPDF(doc, objects, scale, offsetX, offsetY) {
  for (const obj of objects.filter(o => o.type === 'IText' || o.type === 'Text')) {
    if (!obj.visible) continue;

    // Position and scale text
    const x = offsetX + (obj.left || 0) * scale;
    const y = offsetY + (obj.top || 0) * scale;
    const fontSize = (obj.fontSize || 16) * scale;

    // Set font
    try {
      doc.font(obj.fontFamily || 'Helvetica');
    } catch {
      doc.font('Helvetica');
    }

    doc.fontSize(fontSize);
    doc.fillColor(obj.fill || '#000000');

    // Handle font weight and style
    if (obj.fontWeight === 'bold') {
      try { doc.font(`${obj.fontFamily || 'Helvetica'}-Bold`); } catch { }
    }

    // Render text
    const lines = (obj.text || '').split('\n');
    const lineHeight = fontSize * (obj.lineHeight || 1.16);

    lines.forEach((line, index) => {
      let textX = x;
      if (obj.textAlign === 'center') {
        textX = x + (obj.width || 0) * scale / 2 - doc.widthOfString(line) / 2;
      } else if (obj.textAlign === 'right') {
        textX = x + (obj.width || 0) * scale - doc.widthOfString(line);
      }

      doc.text(line, textX, y + (index * lineHeight), {
        lineBreak: false,
        continued: false
      });
    });
  }
}

// Helper function to render fabric.js objects
async function renderFabricObjects(ctx, objects) {
  // Sort objects by their layer order (if available)
  const sortedObjects = objects.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  for (const obj of sortedObjects) {
    if (!obj.visible || obj.type === 'IText' || obj.type === 'Text') continue;
    if (!obj.visible) continue; // Skip invisible objects

    ctx.save();

    // Apply object transformations
    const centerX = (obj.left || 0) + ((obj.width || 0) * (obj.scaleX || 1)) / 2;
    const centerY = (obj.top || 0) + ((obj.height || 0) * (obj.scaleY || 1)) / 2;

    // Move to object position
    ctx.translate(obj.left || 0, obj.top || 0);

    // Apply rotation if present
    if (obj.angle) {
      ctx.translate((obj.width || 0) * (obj.scaleX || 1) / 2, (obj.height || 0) * (obj.scaleY || 1) / 2);
      ctx.rotate((obj.angle * Math.PI) / 180);
      ctx.translate(-((obj.width || 0) * (obj.scaleX || 1) / 2), -((obj.height || 0) * (obj.scaleY || 1) / 2));
    }

    // Apply opacity
    ctx.globalAlpha = obj.opacity || 1;

    // Apply flip transformations
    if (obj.flipX || obj.flipY) {
      ctx.scale(obj.flipX ? -1 : 1, obj.flipY ? -1 : 1);
      if (obj.flipX) ctx.translate(-(obj.width || 0) * (obj.scaleX || 1), 0);
      if (obj.flipY) ctx.translate(0, -(obj.height || 0) * (obj.scaleY || 1));
    }

    switch (obj.type) {
      case 'Rect':
        ctx.fillStyle = obj.fill || '#000000';
        ctx.fillRect(0, 0, (obj.width || 0) * (obj.scaleX || 1), (obj.height || 0) * (obj.scaleY || 1));

        if (obj.stroke) {
          ctx.strokeStyle = obj.stroke;
          ctx.lineWidth = obj.strokeWidth || 1;
          ctx.strokeRect(0, 0, (obj.width || 0) * (obj.scaleX || 1), (obj.height || 0) * (obj.scaleY || 1));
        }
        break;

      case 'IText':
      case 'Text':
        ctx.fillStyle = obj.fill || '#000000';

        // Build font string properly
        let fontString = '';
        if (obj.fontStyle && obj.fontStyle !== 'normal') fontString += obj.fontStyle + ' ';
        if (obj.fontWeight && obj.fontWeight !== 'normal') fontString += obj.fontWeight + ' ';
        fontString += `${obj.fontSize || 16}px `;
        fontString += `"${obj.fontFamily || 'Arial'}"`;

        ctx.font = fontString;
        ctx.textAlign = obj.textAlign || 'left';
        ctx.textBaseline = 'top';

        // Handle text background
        if (obj.textBackgroundColor) {
          ctx.fillStyle = obj.textBackgroundColor;
          ctx.fillRect(0, 0, obj.width || 0, obj.height || 0);
          ctx.fillStyle = obj.fill || '#000000';
        }

        // Handle multi-line text
        const text = obj.text || '';
        const lines = text.split('\n');
        const lineHeight = (obj.fontSize || 16) * (obj.lineHeight || 1.16);

        lines.forEach((line, index) => {
          let xPos = 0;
          if (obj.textAlign === 'center') {
            xPos = (obj.width || 0) / 2;
          } else if (obj.textAlign === 'right') {
            xPos = obj.width || 0;
          }

          ctx.fillText(line, xPos, index * lineHeight);

          // Handle text decorations
          if (obj.underline || obj.overline || obj.linethrough) {
            const textWidth = ctx.measureText(line).width;
            const y = index * lineHeight + (obj.fontSize || 16);

            ctx.beginPath();
            ctx.strokeStyle = obj.fill || '#000000';
            ctx.lineWidth = Math.max(1, (obj.fontSize || 16) / 20);

            if (obj.underline) {
              ctx.moveTo(xPos - (obj.textAlign === 'center' ? textWidth / 2 : 0), y + 2);
              ctx.lineTo(xPos + textWidth - (obj.textAlign === 'center' ? textWidth / 2 : 0), y + 2);
            }
            if (obj.overline) {
              ctx.moveTo(xPos - (obj.textAlign === 'center' ? textWidth / 2 : 0), y - (obj.fontSize || 16) - 2);
              ctx.lineTo(xPos + textWidth - (obj.textAlign === 'center' ? textWidth / 2 : 0), y - (obj.fontSize || 16) - 2);
            }
            if (obj.linethrough) {
              ctx.moveTo(xPos - (obj.textAlign === 'center' ? textWidth / 2 : 0), y - (obj.fontSize || 16) / 2);
              ctx.lineTo(xPos + textWidth - (obj.textAlign === 'center' ? textWidth / 2 : 0), y - (obj.fontSize || 16) / 2);
            }
            ctx.stroke();
          }
        });
        break;

      case 'Image':
        if (obj.src) {
          try {
            const response = await axios.get(obj.src, {
              responseType: 'arraybuffer',
              timeout: 10000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            const imageBuffer = Buffer.from(response.data);
            const image = await loadImage(imageBuffer);

            const drawWidth = (obj.width || image.width) * (obj.scaleX || 1);
            const drawHeight = (obj.height || image.height) * (obj.scaleY || 1);

            // Handle crop if present
            if (obj.cropX || obj.cropY) {
              const cropX = obj.cropX || 0;
              const cropY = obj.cropY || 0;
              const cropWidth = obj.width || image.width;
              const cropHeight = obj.height || image.height;

              ctx.drawImage(
                image,
                cropX, cropY, cropWidth, cropHeight,
                0, 0, drawWidth, drawHeight
              );
            } else {
              ctx.drawImage(image, 0, 0, drawWidth, drawHeight);
            }
          } catch (err) {
            console.warn('Failed to load image:', obj.src, err.message);
            // Draw placeholder
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, (obj.width || 100) * (obj.scaleX || 1), (obj.height || 100) * (obj.scaleY || 1));
            ctx.fillStyle = '#999999';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Image Error', ((obj.width || 100) * (obj.scaleX || 1)) / 2, ((obj.height || 100) * (obj.scaleY || 1)) / 2);
          }
        }
        break;

      case 'Circle':
        const radius = ((obj.radius || obj.width / 2) * (obj.scaleX || 1));
        ctx.beginPath();
        ctx.arc(radius, radius, radius, 0, 2 * Math.PI);

        if (obj.fill) {
          ctx.fillStyle = obj.fill;
          ctx.fill();
        }
        if (obj.stroke) {
          ctx.strokeStyle = obj.stroke;
          ctx.lineWidth = obj.strokeWidth || 1;
          ctx.stroke();
        }
        break;
    }

    ctx.restore();
  }
}

// Helper function to add crop marks
function addCropMarks(doc, pageWidth, pageHeight, bleed) {
  const markLength = 10;
  const markOffset = 5;

  doc.strokeColor('#000000');
  doc.lineWidth(0.25);

  // Top-left crop marks
  doc.moveTo(bleed - markOffset, bleed)
    .lineTo(bleed - markOffset - markLength, bleed)
    .stroke();
  doc.moveTo(bleed, bleed - markOffset)
    .lineTo(bleed, bleed - markOffset - markLength)
    .stroke();

  // Top-right crop marks
  doc.moveTo(pageWidth + bleed + markOffset, bleed)
    .lineTo(pageWidth + bleed + markOffset + markLength, bleed)
    .stroke();
  doc.moveTo(pageWidth + bleed, bleed - markOffset)
    .lineTo(pageWidth + bleed, bleed - markOffset - markLength)
    .stroke();

  // Bottom-left crop marks
  doc.moveTo(bleed - markOffset, pageHeight + bleed)
    .lineTo(bleed - markOffset - markLength, pageHeight + bleed)
    .stroke();
  doc.moveTo(bleed, pageHeight + bleed + markOffset)
    .lineTo(bleed, pageHeight + bleed + markOffset + markLength)
    .stroke();

  // Bottom-right crop marks
  doc.moveTo(pageWidth + bleed + markOffset, pageHeight + bleed)
    .lineTo(pageWidth + bleed + markOffset + markLength, pageHeight + bleed)
    .stroke();
  doc.moveTo(pageWidth + bleed, pageHeight + bleed + markOffset)
    .lineTo(pageWidth + bleed, pageHeight + bleed + markOffset + markLength)
    .stroke();
}