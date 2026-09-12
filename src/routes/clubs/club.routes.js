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
  getRandomClubs,
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
import {
  isClubAdmin,
  loadClubByClubId,
  loadClubById, // ← required by isClubAdmin (reads req.club) — was missing before
} from "../../middleware/clubs/club.middleware.js";

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

/* =====================================================
   ⚠️ req.club NOTE
   isClubAdmin (and isClubOwner/isClubMember, if used elsewhere) read
   req.club — they do NOT look it up themselves. loadClubByClubId MUST
   run before any of them or req.club is undefined and the controller
   throws "Cannot read properties of undefined (reading 'owner')".
===================================================== */

router.patch("/:clubId", verifyJWT, loadClubById, isClubAdmin, updateClub);
router.delete("/:clubId", verifyJWT, deleteClub);
router.get("/:clubId", getClubByClubId); // generic catch-all — must stay last among GETs

router.patch("/:clubId/privacy", verifyJWT, loadClubByClubId, isClubAdmin, changeClubPrivacy);
router.get("/:clubId/stats", verifyJWT, getClubStats);
router.post("/:clubId/image", verifyJWT, loadClubByClubId, isClubAdmin, uploadClubImage);
router.get("/discover/random", getRandomClubs); // ← public random-clubs endpoint

/* =====================================================
   POLICIES
===================================================== */

router.get("/:clubId/policies", getClubPolicies);
router.post("/:clubId/policies", verifyJWT, loadClubByClubId, isClubAdmin, addPolicy);
router.patch("/:clubId/policies/:policyId", verifyJWT, loadClubByClubId, isClubAdmin, updatePolicy);
router.delete("/:clubId/policies/:policyId", verifyJWT, loadClubByClubId, isClubAdmin, deletePolicy);
router.patch("/:clubId/policies/reorder", verifyJWT, loadClubByClubId, isClubAdmin, reorderPolicies);

export default router;