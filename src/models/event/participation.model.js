import mongoose from "mongoose";

const EventParticipationSchema = new mongoose.Schema(
  {
    /* ── References ── */
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ── Snapshot at time of registration ── */
    userName: {
      type: String,
      required: true,
      trim: true,
    },

    /* ── Contact ── */
    contactNumber: {
      type: String,
      trim: true,
      default: null,
    },

    /* ── Role ── */
    role: {
      type: String,
      enum: ["participant", "audience"],
      required: true,
      index: true,
    },

    /* ── Team Info ── */
    teamName: {
      type: String,
      trim: true,
      default: null,
    },
    teamMembers: {
      type: [String],
      default: [],
    },

    /* ── Payment ── */
    paymentStatus: {
      type: String,
      enum: ["done", "pending", "rejected"],
      default: "pending",
      index: true,
    },

    /* ── Payment Proof (participant submits after paying) ── */
    transactionId: {
      type: String,
      trim: true,
      default: null,
    },
    utrNumber: {
      type: String,
      trim: true,
      default: null,
    },
    utrSubmittedAt: {
      type: Date,
      default: null,
    },

    /* ── Attendance ── */
    attendance: {
      type: String,
      enum: ["present", "absent", "not_marked"],
      default: "not_marked",
      index: true,
    },
    auditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

/* ── Indexes ── */
EventParticipationSchema.index(
  { activityId: 1, userId: 1 },
  { unique: true, name: "unique_user_activity" }
);
EventParticipationSchema.index({ userId: 1, createdAt: -1 }, { name: "user_timeline" });
EventParticipationSchema.index({ activityId: 1, role: 1 },   { name: "activity_role" });
EventParticipationSchema.index({ eventId: 1, userId: 1 },    { name: "event_user" });

/* ── Pre-hook ── */
EventParticipationSchema.pre("save", function (next) {
  this._wasNewDoc = this.isNew;
  next();
});

/* ── Post-hook: new registration ── */
EventParticipationSchema.post("save", async function (doc) {
  if (!doc._wasNewDoc) return;

  const [Activity, Event, UserProfile] = [
    mongoose.model("Activity"),
    mongoose.model("Event"),
    mongoose.model("UserProfile"),
  ];

  await Promise.all([
    Activity.findByIdAndUpdate(doc.activityId, { $inc: { registrationsCount: 1 } })
      .catch((e) => console.error("[Participation hook] registrationsCount inc:", e.message)),
    Event.findByIdAndUpdate(doc.eventId, { $inc: { totalRegistrations: 1 } })
      .catch((e) => console.error("[Participation hook] totalRegistrations inc:", e.message)),
    UserProfile.findOneAndUpdate(
      { userId: doc.userId },
      { $inc: { totalParticipations: 1 } }
    ).catch((e) => console.error("[Participation hook] totalParticipations inc:", e.message)),
  ]);
});

/* ── Post-hook: registration deleted ── */
EventParticipationSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;

  const [Activity, Event, UserProfile] = [
    mongoose.model("Activity"),
    mongoose.model("Event"),
    mongoose.model("UserProfile"),
  ];

  await Promise.all([
    Activity.findByIdAndUpdate(doc.activityId, { $inc: { registrationsCount: -1 } })
      .catch((e) => console.error("[Participation hook] registrationsCount dec:", e.message)),
    Event.findByIdAndUpdate(doc.eventId, { $inc: { totalRegistrations: -1 } })
      .catch((e) => console.error("[Participation hook] totalRegistrations dec:", e.message)),
    UserProfile.findOneAndUpdate(
      { userId: doc.userId, totalParticipations: { $gt: 0 } },
      { $inc: { totalParticipations: -1 } }
    ).catch((e) => console.error("[Participation hook] totalParticipations dec:", e.message)),
  ]);
});

export const EventParticipation = mongoose.model("EventParticipation", EventParticipationSchema);
export default EventParticipation;