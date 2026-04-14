import express from "express";
import {
  registerForActivity,
  cancelRegistration,
  markAttendance,
  getParticipantsByActivity,
  getParticipantsByEvent,
  getMyActivityRegistration,
  getMyRegistrations,
  getMyRegistrationsCalendar,
  notifyActivityParticipants,
  submitUTR,
  updatePaymentStatus,
} from "../../../controllers/events/Activity/participation.controller.js";
import { verifyJWT } from "../../../middleware/auth.middleware.js";

const router = express.Router();

// Base: /api/v1/events/participation

// ── My registrations (most specific first) ────────────────
router.get("/me/calendar",             verifyJWT, getMyRegistrationsCalendar);
router.get("/me",                      verifyJWT, getMyRegistrations);
router.get("/my/activity/:activityId", verifyJWT, getMyActivityRegistration);

// ── Admin reads ───────────────────────────────────────────
router.get("/activity/:activityId",    verifyJWT, getParticipantsByActivity);
router.get("/event/:eventId",          verifyJWT, getParticipantsByEvent);

// ── Register / Cancel ─────────────────────────────────────
router.post("/register",               verifyJWT, registerForActivity);
router.delete("/:activityId/cancel",   verifyJWT, cancelRegistration);

// ── UTR submission (participant submits their UPI ref) ────
router.patch("/:participationId/utr",  verifyJWT, submitUTR);

// ── Payment status update (admin marks paid/rejected) ────
router.patch("/:participationId/payment", verifyJWT, updatePaymentStatus);

// ── Admin: notify broadcast ───────────────────────────────
router.post("/activity/:activityId/notify", verifyJWT, notifyActivityParticipants);

// ── Attendance (keep last — param route) ─────────────────
router.patch("/:participationId/attendance", verifyJWT, markAttendance);

export default router;