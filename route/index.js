const express = require("express");
const multer = require("multer");
const router = express.Router();
const { uploadPdf } = require("../controller/index");
const {chat } = require("../controller/chat")


const controller = require("../controller/index");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), uploadPdf);
router.post("/chat", chat)

module.exports = router;