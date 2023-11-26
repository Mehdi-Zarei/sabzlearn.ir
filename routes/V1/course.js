const express = require("express");
const courseRouter = express.Router();
const multer = require("multer");
const multerStorage = require("../../utils/uploader");
const authMiddleware = require("../../middlewares/auth");
const isAdminMiddleware = require("../../middlewares/isAdmin");
const courseController = require("../../controllers/V1/course");

courseRouter
  .route("/")
  .post(
    multer({ storage: multerStorage }).single("cover"),
    authMiddleware,
    isAdminMiddleware,
    courseController.create
  );

module.exports = courseRouter;
