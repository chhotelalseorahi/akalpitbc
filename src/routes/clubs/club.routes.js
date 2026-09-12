import express from "express";

import {
  createClub,
  updateClub,
  deleteClub,
  getDeletedClubByUserId,
  checkClubIdAvailability,
  getClubByClubId,
  getClubById,
  getClubByUserId,
  getAllClubs,
  getClubsByCategory,
  getClubsByCouncil,
  getClubsByInstitution,
  searchClubs,
  discoverClubs,
  getRandomClubs, // ← new
  joinClub,
  leaveClub,
  promoteToAdmin,
  removeAdmin,
  removeMember,
  changeClubPrivacy,
  getClubStats,
  getMyClubs,
  uploadClubImage,
} from "../../controllers/clubs/club.controller.js";

import {
  getClubPolicies,
  addPolicy,
  updatePolicy,
  deletePolicy,
  reorderPolicies,
} from "../../controllers/clubs/policy.controller.js";

import { verifyJWT } from "../../middleware/auth.middleware.js";
import { isClubAdmin } from "../../middleware/clubs/club.middleware.js";

const router = express.Router();

router.post("/", verifyJWT, createClub);

/* =====================================================
   ⚠️ ROUTE-ORDER NOTE
   Every single-segment literal route (e.g. "/search", "/discover") MUST be
   registered BEFORE "/:clubId" and "/" (getAllClubs). Express matches routes
   in registration order, and "/:clubId" will happily swallow "/discover" as
   if someone passed clubId="discover" if it's declared first — which is
   exactly what was happening before this fix (discoverClubs was completely
   unreachable). Multi-segment routes like "/category/:categoryId" don't
   have this problem since they don't share a shape with "/:clubId".
===================================================== */

router.get("/check/:clubId", checkClubIdAvailability);
router.get("/search", searchClubs);
router.get("/discover", discoverClubs);         // ← moved above "/:clubId" to fix shadowing
router.get("/category/:categoryId", getClubsByCategory);
router.get("/council/:councilId", getClubsByCouncil);
router.get("/institution/:institutionId", getClubsByInstitution);

router.get("/id/:Id", verifyJWT, getClubById);
router.get("/user/myclub", verifyJWT, getClubByUserId);
router.get("/admin/user/:userId/history", getDeletedClubByUserId);
router.get("/my/clubs", verifyJWT, getMyClubs);

router.get("/", getAllClubs);

router.patch("/:clubId", verifyJWT, isClubAdmin, updateClub);
router.delete("/:clubId", verifyJWT, deleteClub);
router.get("/:clubId", getClubByClubId); // generic catch-all — must stay last among GETs

router.patch("/:clubId/privacy", verifyJWT, isClubAdmin, changeClubPrivacy);
router.get("/:clubId/stats", verifyJWT, getClubStats);
router.post("/:clubId/image", verifyJWT, isClubAdmin, uploadClubImage);
router.get("/discover/random", getRandomClubs); // ← new public random-clubs endpoint

/* =====================================================
   POLICIES
===================================================== */

router.get("/:clubId/policies", getClubPolicies);
router.post("/:clubId/policies", verifyJWT, isClubAdmin, addPolicy);
router.patch("/:clubId/policies/:policyId", verifyJWT, isClubAdmin, updatePolicy);
router.delete("/:clubId/policies/:policyId", verifyJWT, isClubAdmin, deletePolicy);
router.patch("/:clubId/policies/reorder", verifyJWT, isClubAdmin, reorderPolicies);

export default router;