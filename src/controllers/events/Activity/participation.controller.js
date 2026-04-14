import mongoose from "mongoose";
import { EventParticipation } from "../../../models/event/participation.model.js";
import { Activity }           from "../../../models/event/Activity/masterday.model.js";
import { Event }              from "../../../models/event/event.model.js";
import User                   from "../../../models/Profile/auth.models.js";
import admin                  from "../../../../config/firebase.js";
import { ApiError }           from "../../../utils/ApiError.js";
import { ApiResponse }        from "../../../utils/ApiResponse.js";
import { asynchandler }       from "../../../utils/asynchandler.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ══════════════════════════════════════════════════════════
   REGISTER FOR ACTIVITY
   POST /api/v1/events/participation/register
   Body: eventId, activityId, role, userName, contactNumber
         [teamName, teamMembers[]]
══════════════════════════════════════════════════════════ */
export const registerForActivity = asynchandler(async (req, res) => {
  const {
    eventId, activityId, role, userName,
    contactNumber, teamName, teamMembers,
  } = req.body;

  if (!eventId || !activityId || !role || !userName) {
    throw new ApiError(400, "eventId, activityId, role, and userName are required");
  }

  if (!contactNumber || contactNumber.trim().length < 10) {
    throw new ApiError(400, "A valid 10-digit contact number is required for registration");
  }

  if (!["participant", "audience"].includes(role)) {
    throw new ApiError(400, "role must be 'participant' or 'audience'");
  }

  if (!isValidId(eventId) || !isValidId(activityId)) {
    throw new ApiError(400, "Invalid eventId or activityId");
  }

  const event = await Event.findById(eventId).select("status name").lean();
  if (!event) throw new ApiError(404, "Event not found");
  if (event.status !== "published") throw new ApiError(400, "Event is not open for registration");

  const activity = await Activity.findOne({ _id: activityId, eventId })
    .select("activityName status registrationDeadline maxParticipants registrationsCount participationFee teamAllowed teamSize")
    .lean();

  if (!activity) throw new ApiError(404, "Activity not found in this event");
  if (activity.status === "cancelled") throw new ApiError(400, "This activity has been cancelled");
  if (new Date() > new Date(activity.registrationDeadline)) {
    throw new ApiError(400, "Registration deadline for this activity has passed");
  }

  if (activity.maxParticipants !== null && activity.registrationsCount >= activity.maxParticipants) {
    throw new ApiError(400, "This activity has reached maximum capacity");
  }

  if (role === "participant" && activity.teamAllowed) {
    if (!teamName) throw new ApiError(400, "teamName is required for team-based activities");
    const memberCount = (teamMembers || []).length + 1;
    if (memberCount < activity.teamSize.min || memberCount > activity.teamSize.max) {
      throw new ApiError(400, `Team size must be between ${activity.teamSize.min} and ${activity.teamSize.max}`);
    }
  }

  const existing = await EventParticipation.findOne({ activityId, userId: req.user._id }).lean();
  if (existing) throw new ApiError(409, "You are already registered for this activity");

  const participation = await EventParticipation.create({
    eventId,
    activityId,
    userId:        req.user._id,
    userName,
    contactNumber: contactNumber.trim(),
    role,
    teamName:      teamName    || null,
    teamMembers:   teamMembers || [],
    paymentStatus: activity.participationFee > 0 ? "pending" : "done",
  });

  // FCM subscribe
  const userDoc = await User.findById(req.user._id).select("deviceTokens").lean();
  const tokens  = (userDoc?.deviceTokens || []).filter(Boolean);
  if (tokens.length > 0) {
    admin.messaging()
      .subscribeToTopic(tokens, `activity_${activityId}`)
      .catch((e) => console.error("FCM subscribe:", e.message));
  }

  return res.status(201).json(new ApiResponse(201, participation, "Registered successfully"));
});

/* ══════════════════════════════════════════════════════════
   SUBMIT PAYMENT PROOF (UTR + Transaction ID)
   PATCH /api/v1/events/participation/:participationId/utr
   Auth: required (own participation only)
   Body: transactionId, utrNumber (at least one required)
══════════════════════════════════════════════════════════ */
export const submitUTR = asynchandler(async (req, res) => {
  const { participationId }          = req.params;
  const { transactionId, utrNumber } = req.body;

  if (!isValidId(participationId)) throw new ApiError(400, "Invalid participationId");

  if (!transactionId && !utrNumber) {
    throw new ApiError(400, "At least one of transactionId or utrNumber is required");
  }

  const record = await EventParticipation.findOne({
    _id:    participationId,
    userId: req.user._id,   // only own participation
  });

  if (!record) throw new ApiError(404, "Participation record not found");
  if (record.paymentStatus === "done") {
    throw new ApiError(400, "Payment is already marked as done");
  }

  if (transactionId) record.transactionId = transactionId.trim();
  if (utrNumber)     record.utrNumber     = utrNumber.trim();
  record.utrSubmittedAt = new Date();

  await record.save();

  return res.status(200).json(
    new ApiResponse(200, record, "Payment proof submitted successfully. Awaiting admin verification.")
  );
});

/* ══════════════════════════════════════════════════════════
   UPDATE PAYMENT STATUS (admin only)
   PATCH /api/v1/events/participation/:participationId/payment
   Auth: required (admin/organiser)
   Body: paymentStatus (done | pending | rejected)
══════════════════════════════════════════════════════════ */
export const updatePaymentStatus = asynchandler(async (req, res) => {
  const { participationId } = req.params;
  const { paymentStatus }   = req.body;

  if (!isValidId(participationId)) throw new ApiError(400, "Invalid participationId");
  if (!["done", "pending", "rejected"].includes(paymentStatus)) {
    throw new ApiError(400, "paymentStatus must be done, pending, or rejected");
  }

  const record = await EventParticipation.findById(participationId);
  if (!record) throw new ApiError(404, "Participation record not found");

  record.paymentStatus = paymentStatus;
  record.auditedBy     = req.user._id;
  await record.save();

  return res.status(200).json(new ApiResponse(200, record, "Payment status updated"));
});

/* ══════════════════════════════════════════════════════════
   CANCEL MY REGISTRATION
   DELETE /api/v1/events/participation/:activityId/cancel
══════════════════════════════════════════════════════════ */
export const cancelRegistration = asynchandler(async (req, res) => {
  const { activityId } = req.params;
  if (!isValidId(activityId)) throw new ApiError(400, "Invalid activityId");

  const record = await EventParticipation.findOneAndDelete({
    activityId,
    userId: req.user._id,
  });

  if (!record) throw new ApiError(404, "Registration not found");

  const userDoc = await User.findById(req.user._id).select("deviceTokens").lean();
  const tokens  = (userDoc?.deviceTokens || []).filter(Boolean);
  if (tokens.length > 0) {
    admin.messaging()
      .unsubscribeFromTopic(tokens, `activity_${activityId}`)
      .catch((e) => console.error("FCM unsubscribe:", e.message));
  }

  return res.status(200).json(new ApiResponse(200, null, "Registration cancelled"));
});

/* ══════════════════════════════════════════════════════════
   MARK ATTENDANCE
   PATCH /api/v1/events/participation/:participationId/attendance
══════════════════════════════════════════════════════════ */
export const markAttendance = asynchandler(async (req, res) => {
  const { participationId } = req.params;
  const { attendance }      = req.body;

  if (!["present", "absent"].includes(attendance)) {
    throw new ApiError(400, "attendance must be 'present' or 'absent'");
  }
  if (!isValidId(participationId)) throw new ApiError(400, "Invalid participationId");

  const record = await EventParticipation.findById(participationId);
  if (!record) throw new ApiError(404, "Participation record not found");

  record.attendance = attendance;
  record.auditedBy  = req.user._id;
  await record.save();

  return res.status(200).json(new ApiResponse(200, record, "Attendance marked"));
});

/* ══════════════════════════════════════════════════════════
   GET PARTICIPANTS BY ACTIVITY
   GET /api/v1/events/participation/activity/:activityId
══════════════════════════════════════════════════════════ */
export const getParticipantsByActivity = asynchandler(async (req, res) => {
  const { activityId } = req.params;
  const { role }       = req.query;

  if (!isValidId(activityId)) throw new ApiError(400, "Invalid activityId");
  if (role && !["participant", "audience"].includes(role)) {
    throw new ApiError(400, "role must be 'participant' or 'audience'");
  }

  const filter = { activityId };
  if (role) filter.role = role;

  const participants = await EventParticipation.find(filter)
    .sort({ createdAt: 1 })
    .lean();

  return res.status(200).json(
    new ApiResponse(200, { count: participants.length, participants }, "Participants fetched")
  );
});

/* ══════════════════════════════════════════════════════════
   GET ALL PARTICIPANTS FOR AN EVENT
   GET /api/v1/events/participation/event/:eventId
══════════════════════════════════════════════════════════ */
export const getParticipantsByEvent = asynchandler(async (req, res) => {
  const { eventId }          = req.params;
  const { role, activityId } = req.query;

  if (!isValidId(eventId)) throw new ApiError(400, "Invalid eventId");

  const filter = { eventId };
  if (role)       filter.role       = role;
  if (activityId) filter.activityId = activityId;

  const participants = await EventParticipation.find(filter)
    .populate("activityId", "activityName dayNumber date category")
    .sort({ createdAt: 1 })
    .lean();

  return res.status(200).json(
    new ApiResponse(200, { count: participants.length, participants }, "Participants fetched")
  );
});

/* ══════════════════════════════════════════════════════════
   GET MY REGISTRATION FOR A SPECIFIC ACTIVITY
   GET /api/v1/events/participation/my/activity/:activityId
══════════════════════════════════════════════════════════ */
export const getMyActivityRegistration = asynchandler(async (req, res) => {
  const { activityId } = req.params;
  if (!isValidId(activityId)) throw new ApiError(400, "Invalid activityId");

  const record = await EventParticipation.findOne({ activityId, userId: req.user._id })
    .populate("eventId",    "name startDate endDate banner status")
    .populate("activityId", "activityName category dayNumber date venueLogistics status")
    .lean();

  if (!record) throw new ApiError(404, "You are not registered for this activity");

  return res.status(200).json(new ApiResponse(200, record, "Registration fetched"));
});

/* ══════════════════════════════════════════════════════════
   GET ALL MY REGISTRATIONS
   GET /api/v1/events/participation/me
══════════════════════════════════════════════════════════ */
export const getMyRegistrations = asynchandler(async (req, res) => {
  const registrations = await EventParticipation.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .populate("eventId",    "name banner type genre startDate endDate status")
    .populate("activityId", "activityName category dayNumber date participationFee registrationDeadline venueLogistics status")
    .lean();

  return res.status(200).json(
    new ApiResponse(200, { count: registrations.length, registrations }, "Registrations fetched")
  );
});

/* ══════════════════════════════════════════════════════════
   GET MY REGISTRATIONS GROUPED BY DATE (calendar)
   GET /api/v1/events/participation/me/calendar
══════════════════════════════════════════════════════════ */
export const getMyRegistrationsCalendar = asynchandler(async (req, res) => {
  const data = await EventParticipation.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(req.user._id) } },
    {
      $lookup: {
        from: "activities",
        localField: "activityId",
        foreignField: "_id",
        as: "activity",
        pipeline: [{ $project: { activityName: 1, category: 1, dayNumber: 1, date: 1, venueLogistics: 1, status: 1 } }],
      },
    },
    { $unwind: { path: "$activity", preserveNullAndEmpty: true } },
    {
      $addFields: {
        calendarDate: {
          $dateToString: { format: "%Y-%m-%d", date: { $ifNull: ["$activity.date", "$createdAt"] } },
        },
      },
    },
    {
      $group: {
        _id:   "$calendarDate",
        count: { $sum: 1 },
        items: { $push: "$$ROOT" },
      },
    },
    { $project: { _id: 0, date: "$_id", count: 1, items: 1 } },
    { $sort: { date: 1 } },
  ]);

  return res.status(200).json(new ApiResponse(200, data, "Calendar registrations fetched"));
});

/* ══════════════════════════════════════════════════════════
   NOTIFY ACTIVITY PARTICIPANTS (admin broadcast)
   POST /api/v1/events/participation/activity/:activityId/notify
══════════════════════════════════════════════════════════ */
export const notifyActivityParticipants = asynchandler(async (req, res) => {
  const { activityId }             = req.params;
  const { title, message, data = {} } = req.body;

  if (!isValidId(activityId)) throw new ApiError(400, "Invalid activityId");
  if (!message) throw new ApiError(400, "message is required");

  await admin.messaging().send({
    topic: `activity_${activityId}`,
    notification: {
      title: title || "Activity Update",
      body:  message.length > 120 ? message.slice(0, 117) + "..." : message,
    },
    data: {
      activityId: activityId.toString(),
      type:       "ACTIVITY_NOTIFY",
      ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    },
  });

  return res.status(200).json(new ApiResponse(200, null, "Notification sent"));
});