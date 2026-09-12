import mongoose from "mongoose";

const PolicySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

const ClubSchema = new mongoose.Schema(
  {
    owner: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      displayName: {
        type: String,
        required: true,
        trim: true,
      },
    },

    clubId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9._]+$/,
    },

    clubName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    image: { type: String, trim: true, default: null },
    coverImage: { type: String, trim: true, default: null },
    about: { type: String, trim: true, maxlength: 1000, default: "" },

    council: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "Council", default: null },
      name: { type: String, trim: true, default: null },
    },

    institution: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", default: null },
      name: { type: String, trim: true, default: null },
    },

    privacy: {
      type: String,
      enum: ["public", "private", "invite_only"],
      default: "public",
    },

    status: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
    },

    membersCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },
    eventsCount: { type: Number, default: 0 },
    createdBySystem: { type: Boolean, default: false },

    // 💳 UPI ID for donations/payments/dues collection
    upiId: {
      type: String,
      trim: true,
      default: null,
      match: /^[\w.-]+@[\w.-]+$/, // basic UPI id format check, e.g. name@bank
    },

    // 📜 Club policies — Rules, Code of Conduct, Privacy Policy, etc.
    policies: {
      type: [PolicySchema],
      default: [],
    },
  },
  { timestamps: true }
);

/* -------------------------------------------------------------------------- */
/* INDEXES                                   */
/* -------------------------------------------------------------------------- */

ClubSchema.index({ "owner.id": 1 }, { unique: true });

ClubSchema.index(
  { clubId: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

ClubSchema.index({
  clubName: "text",
  about: "text",
  "owner.displayName": "text",
  "institution.name": "text",
  "council.name": "text",
});

ClubSchema.index({ status: 1, privacy: 1 });
ClubSchema.index({ "council.id": 1, "institution.id": 1 });
ClubSchema.index({ "institution.id": 1, status: 1 });

export const Club = mongoose.model("Club", ClubSchema);

Club.syncIndexes().catch((err) => console.error("Index Sync Error:", err));

export default Club;