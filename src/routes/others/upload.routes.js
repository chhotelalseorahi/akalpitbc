import express from "express";
import { upload } from "../../middleware/multer.middleware.js";
import { uploadImage, uploadImages, deleteImage,replaceImage  } from "../../controllers/upload.controller.js";
import { verifyJWT } from "../../middleware/auth.middleware.js";

const router = express.Router();

// Single image upload
router.post("/image", verifyJWT, upload.single("image"), uploadImage);

// Multiple image upload (up to 10 at once)
router.post("/images", verifyJWT, upload.array("images", 10), uploadImages);
router.post("/image/replace", verifyJWT, upload.single("image"), replaceImage);
// Delete an uploaded image by its storage key
router.delete("/image", verifyJWT, deleteImage);

export default router;

  