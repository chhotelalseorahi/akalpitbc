import { Club } from "../../models/club/club.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

/* =====================================================
   POLICIES
===================================================== */

export const getClubPolicies = async (req, res) => {
  const { clubId } = req.params;

  const club = await Club.findOne({
    clubId: clubId.toLowerCase(),
    status: "active",
  })
    .select("policies")
    .lean();

  if (!club) {
    throw new ApiError(404, "Club not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, club.policies || [], "Policies fetched successfully"));
};

export const addPolicy = async (req, res) => {
  const { clubId } = req.params;
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "title and description are required");
  }

  const club = await Club.findOne({
    clubId: clubId.toLowerCase(),
    status: "active",
  });

  if (!club) {
    throw new ApiError(404, "Club not found");
  }

  club.policies.push({ title, description });
  await club.save();

  return res
    .status(201)
    .json(new ApiResponse(201, club.policies, "Policy added successfully"));
};

export const updatePolicy = async (req, res) => {
  const { clubId, policyId } = req.params;
  const { title, description } = req.body;

  const club = await Club.findOne({
    clubId: clubId.toLowerCase(),
    status: "active",
  });

  if (!club) {
    throw new ApiError(404, "Club not found");
  }

  const policy = club.policies.id(policyId);
  if (!policy) {
    throw new ApiError(404, "Policy not found");
  }

  if (title !== undefined) policy.title = title;
  if (description !== undefined) policy.description = description;

  await club.save();

  return res
    .status(200)
    .json(new ApiResponse(200, club.policies, "Policy updated successfully"));
};

export const deletePolicy = async (req, res) => {
  const { clubId, policyId } = req.params;

  const club = await Club.findOne({
    clubId: clubId.toLowerCase(),
    status: "active",
  });

  if (!club) {
    throw new ApiError(404, "Club not found");
  }

  const policy = club.policies.id(policyId);
  if (!policy) {
    throw new ApiError(404, "Policy not found");
  }

  policy.deleteOne();
  await club.save();

  return res
    .status(200)
    .json(new ApiResponse(200, club.policies, "Policy deleted successfully"));
};

export const reorderPolicies = async (req, res) => {
  const { clubId } = req.params;
  const { order } = req.body; // array of policy _id strings, in desired order

  if (!Array.isArray(order)) {
    throw new ApiError(400, "order must be an array of policy ids");
  }

  const club = await Club.findOne({
    clubId: clubId.toLowerCase(),
    status: "active",
  });

  if (!club) {
    throw new ApiError(404, "Club not found");
  }

  const policyMap = new Map(club.policies.map((p) => [p._id.toString(), p]));

  const reordered = order.map((id) => policyMap.get(id)).filter(Boolean);

  if (reordered.length !== club.policies.length) {
    throw new ApiError(400, "order must include all existing policy ids");
  }

  club.policies = reordered;
  await club.save();

  return res
    .status(200)
    .json(new ApiResponse(200, club.policies, "Policies reordered successfully"));
};