const path = require("path");
const multer = require("multer");
const { Router } = require("express");
const { getImageController, createImageController } = require("../controllers");

const router = Router();

// multer middleware
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../public/images"),
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
})

const upload = multer({
  storage: storage
})

// GET: /documents and GET: /documents?query=search_text
router.route("/documents").get(getImageController)
// POST: /documents
router.route("/documents").post(upload.single("imageFile"), createImageController)

module.exports = { router };
