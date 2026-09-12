import mongoose from "mongoose";
import Club from "../../models/club/club.model.js";
import { ClubMembership } from "../../models/connections/userToClub.model.js"; // adjust path if needed

/**
 * Validate Mongo ObjectId
 */
export const validateObjectId = (param = "id") => {
  return (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params[param])) {
      return res.status(400).json({ message: "Invalid ObjectId" });
    }
    next();
  };
};

/**
 * Load club by clubId (insta-like slug)
 * Attaches club to req.club
 */
export const loadClubByClubId = async (req, res, next) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findOne({
      clubId: clubId.toLowerCase(),
      status: "active",
    });

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    req.club = club;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Load club by Mongo _id
 */
export const loadClubById = async (req, res, next) => {
  try {
    const { clubId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(clubId)) {
      return res.status(400).json({ message: "Invalid club id" });
    }

    const club = await Club.findOne({ _id: clubId, status: "active" });
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    req.club = club;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is club owner
 */
export const isClubOwner = (req, res, next) => {
  if (req.club.owner.id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only club owner allowed" });
  }
  next();
};

/**
 * Check if user is admin or owner (via ClubMembership, not req.club)
 */
export const isClubAdmin = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    // Fast path: club document owner never needs a membership row check
    if (req.club.owner.id.toString() === userId) {
      return next();
    }

    const membership = await ClubMembership.findOne({
      clubId: req.club._id,
      userId: req.user._id,
      status: "approved",
      role: { $in: ["owner", "admin"] },
    });

    if (!membership) {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is an approved club member (via ClubMembership)
 */
export const isClubMember = async (req, res, next) => {
  try {
    const membership = await ClubMembership.findOne({
      clubId: req.club._id,
      userId: req.user._id,
      status: "approved",
    });

    if (!membership) {
      return res.status(403).json({ message: "Join the club first" });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Prevent duplicate join
 */
export const isNotAlreadyMember = async (req, res, next) => {
  try {
    const existing = await ClubMembership.findOne({
      clubId: req.club._id,
      userId: req.user._id,
      status: { $in: ["pending", "approved"] },
    });

    if (existing) {
      return res.status(409).json({ message: "Already a member" });
    }

    next();
  } catch (error) {
    next(error);
  }
};