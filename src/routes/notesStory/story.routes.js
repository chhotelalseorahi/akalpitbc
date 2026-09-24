import express from "express";
import {
  createStory,
  getStoryByUserId,
  getStoryByStoryId,
  getStoryByClubId,
  getHomeFeed,
  updateStory,
  patchStory,
  deleteStory,
} from "../../controllers/story/story.controller.js";
import { verifyJWT } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", verifyJWT, createStory);

// Declared before "/:storyId" for clarity even though "/feed/home" is a
// two-segment path and wouldn't actually collide with it.
router.get("/feed/home", verifyJWT, getHomeFeed);

router.get("/:storyId", getStoryByStoryId);

router.get("/user/:userId", verifyJWT, getStoryByUserId);
router.get("/club/:clubId", verifyJWT, getStoryByClubId);
router.put("/:topicId", verifyJWT, updateStory);

router.patch("/:topicId", verifyJWT, patchStory);

router.delete("/:topicId", verifyJWT, deleteStory);

export default router;