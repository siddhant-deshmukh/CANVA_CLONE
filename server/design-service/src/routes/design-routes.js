const express = require("express");
const designController = require("../controllers/design-controller");
const templateController = require("../controllers/template-controller");
const authenticatedRequest = require("../middleware/auth-middleware");

const router = express.Router();

router.use(authenticatedRequest);

router.get("/t", templateController.getUserTemplates);
router.get("/t/:id", templateController.getUserTemplatesByID);
router.post("/t", templateController.saveTemplate);
router.delete("/t/:id", templateController.deleteTemplate);

router.get("/", designController.getUserDesigns);
router.get("/:id", designController.getUserDesignsByID);
router.post("/", designController.saveDesign);
router.delete("/:id", designController.deleteDesign);

module.exports = router;
