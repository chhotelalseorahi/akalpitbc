import admin from "../../../config/firebase.js";
import mongoose from "mongoose";
import BlockBase from "../../models/story/block.model.js";
import Story from "../../models/story/masterStory.model.js";

// ── Block discriminators MUST be imported here so Mongoose registers them
// before createStory tries to look them up via BlockBase.discriminators[type].
// Importing in app.js is not enough — discriminators only register in the
// module scope where the import runs.
import "../../models/story/supporterTypes/paragraph.model.js";
import "../../models/story/supporterTypes/heading.model.js";
import "../../models/story/supporterTypes/image.model.js";
import "../../models/story/supporterTypes/quote.model.js";
import "../../models/story/supporterTypes/list.model.js";
import "../../models/story/supporterTypes/divider.model.js";
import "../../models/story/supporterTypes/sidenotes.model.js";
import "../../models/story/supporterTypes/timeliner.model.js";
import "../../models/story/supporterTypes/table.model.js";
import "../../models/story/supporterTypes/poetry.model.js";
import "../../models/story/supporterTypes/mcqs.model.js";
import "../../models/story/supporterTypes/chatting.model.js";

// ── Link-preview helpers ─────────────────────────────────────────────────

// Bots that generate rich link previews. Expand as needed.
const CRAWLER_UA_REGEX =
  /(WhatsApp|facebookexternalhit|Twitterbot|Slackbot|TelegramBot|LinkedInBot|Discordbot|Googlebot|SkypeUriPreview|Pinterest)/i;

const escapeHtml = (str = "") =>
  String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

// Pulls a short description out of the first paragraph-type block, if any.
const extractExcerpt = (story) => {
  const paragraphBlock = story.blocks?.find((b) => b.type === "paragraph");
  const text = paragraphBlock?.text || paragraphBlock?.content;
  if (!text) return "Read this story on Akalpit";
  return text.length > 150 ? `${text.slice(0, 147)}...` : text;
};

const renderStoryOgPage = (story) => {
  const safeTitle = escapeHtml(story.title);
  const safeDesc = escapeHtml(extractExcerpt(story));
  const imageUrl = story.image || "";
  const pageUrl = `https://api.akalpit.in/stories/${story._id}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${safeTitle}</title>
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  ${imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}" />` : ""}
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${pageUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
</head>
<body></body>
</html>`;
};

export const createStory = async (req, res) => {
  try {
    const userId = req.user._id; 
    // Extract clubId from body
    const { title, image, blocks, clubId } = req.body;

    if (!title || !clubId) {
      return res.status(400).json({
        message: "Title and Club ID are required",
      });
    }

    const mappedBlocks = blocks?.map((block) => {
      const BlockModel = BlockBase.discriminators?.[block.type];
      if (!BlockModel) {
        throw new Error(`Invalid block type: ${block.type}`);
      }
      return new BlockModel(block);
    });

    const story = new Story({
      title,
      userId,
      clubId, // ✅ Store the club relationship
      ...(image && { image }),
      blocks: mappedBlocks || [],
    });

    const savedStory = await story.save();

    /* ----------------------------------
       🔔 NOTIFICATION LOGIC
    ---------------------------------- */
    
    // We send to the CLUB topic so all members get the update
    const clubTopic = `club_${clubId}`;
    const userTopic = `user_${userId}`;

    const notificationPayload = {
      notification: {
        title: "New Story in Club! 📖",
        body: `${req.user.displayName || "Someone"} posted: ${title}`,
      },
      data: {
        type: "NEW_STORY",
        storyId: savedStory._id.toString(),
        clubId: clubId.toString(),
        userId: userId.toString(),
      },
    };

    // Send to Club Topic (Scalable way to reach all club members)
    admin.messaging().send({ ...notificationPayload, topic: clubTopic })
      .catch(err => console.error("Club FCM failed:", err.message));

    // Optional: Still send to personal followers if needed
    admin.messaging().send({ ...notificationPayload, topic: userTopic })
      .catch(err => console.error("User FCM failed:", err.message));

    return res.status(201).json({ data: savedStory });

  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate story detected." });
    }
    return res.status(500).json({ message: err.message });
  }
};


export const getStoryByStoryId = async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findOne({ _id: storyId }).populate(
      "userId",
      "displayName imageUrl"  
    );

    if (!story) {
      // Bots still need a 200 + fallback tags, or they render nothing.
      // A 404 for a real browser/app is fine as-is.
      return res.status(404).json({ message: "Story not found" });
    }

    const userAgent = req.headers["user-agent"] || "";
    const isCrawler = CRAWLER_UA_REGEX.test(userAgent);
    const wantsHtml = (req.headers.accept || "").includes("text/html");

    // 1. Link-preview bots (WhatsApp, etc.) → OG-tagged HTML page
    if (isCrawler) {
      res.set("Content-Type", "text/html");
      return res.status(200).send(renderStoryOgPage(story));
    }

    // 2. A real person opening the link in a mobile browser (not the app,
    //    not a bot) → send them to the store/app instead of raw JSON.
    //    App/API calls typically request application/json explicitly, so
    //    this only catches actual browser navigation.
    if (wantsHtml) {
      return res.redirect(
        "https://play.google.com/store/apps/details?id=YOUR_PACKAGE"
      );
    }

    // 3. Everything else (the Flutter app fetching story data) → JSON as before
    res.status(200).json({ data: story });
  } catch (error) {
    console.error("Get story error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getStoryByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const page  = Math.max(parseInt(req.query.page)  || 1,  1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip  = (page - 1) * limit;

    const [stories, total] = await Promise.all([
      Story.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("title image createdAt userId clubId")
        .populate("userId", "username displayName imageUrl")
        .populate("clubId", "clubName image"),
      Story.countDocuments({ userId }),
    ]);

    if (!stories.length && page === 1) {
      return res.status(200).json({
        data: [],
        meta: { page, limit, total: 0, totalPages: 0, hasNextPage: false },
      });
    }

    const result = stories.map((story) => ({
      storyId:   story._id,
      title:     story.title,
      image:     story.image || null,
      createdAt: story.createdAt,
      clubId:    story.clubId?._id ?? story.clubId,
      clubName:  story.clubId?.clubName ?? null,
      clubImage: story.clubId?.image    ?? null,
      author: {
        userId:      story.userId?._id,
        username:    story.userId?.username    ?? "",
        displayName: story.userId?.displayName ?? "",
        imageUrl:    story.userId?.imageUrl    ?? null,
      },
    }));

    res.status(200).json({
      data: result,
      meta: {
        page,
        limit,
        total,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get user stories error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getStoryByClubId = async (req, res) => {
  try {
    const { clubId } = req.params;
    
    // Pagination logic
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const [stories, total] = await Promise.all([
      Story.find({ clubId })
        .sort({ createdAt: -1 }) // 🔥 Uses the { clubId: 1, createdAt: -1 } index
        .skip(skip)
        .limit(limit)
        .select("title image createdAt userId clubId")
        .populate("userId", "username displayName profileImage"), // Fetch author details
      Story.countDocuments({ clubId }),
    ]);

    if (!stories.length && page === 1) {
      return res.status(404).json({ message: "No stories found in this club" });
    }

    const result = stories.map((story) => ({
      storyId: story._id,
      title: story.title,
      image: story.image || null,
      createdAt: story.createdAt,
      clubId: story.clubId,
      author: {
        userId: story.userId?._id,
        username: story.userId?.username,
        displayName: story.userId?.displayName,
        profileImage: story.userId?.profileImage,
      },
    }));

    res.status(200).json({
      data: result,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get club stories error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ── Home feed — mixes stories from the user's clubs/institutions/friends
// with a slice of pure-random "discovery" stories, interleaved together,
// so the feed always has fresh content instead of drying up for users who
// haven't joined much yet, or feeling like "your stuff, then strangers".
//
// ⚠️ ASSUMPTIONS — I don't have your User model, so this reads these
// fields straight off req.user (populated by verifyJWT, same as
// req.user.displayName is used elsewhere in this file). Rename them to
// match your actual schema if they differ:
//   req.user.joinedClubs        → array of Club ObjectIds
//   req.user.joinedInstitutions → array of Institution ObjectIds
//   req.user.friends / .following → array of User ObjectIds
// If institutions post stories through a separate field rather than
// clubId, add that field to the $or below.
//
// Randomness + offset-pagination don't compose for free — each $sample
// call is independent, so nothing stops the same random story showing up
// on page 2 that showed on page 1. The fix used here: the client tracks
// which story _ids it has already rendered this session and sends them
// back as `excludeIds` (comma-separated) on every subsequent request;
// the response's meta.nextExcludeIds is exactly that running list, ready
// to hand back unchanged. No excludeIds sent = start of a fresh session
// (e.g. pull-to-refresh).
export const getHomeFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(parseInt(req.query.limit) || 15, 50);
    const excludeIds = (req.query.excludeIds || "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const clubIds = req.user.joinedClubs || [];
    const institutionIds = req.user.joinedInstitutions || [];
    const friendIds = req.user.friends || req.user.following || [];

    const personalizedFilter = {
      _id: { $nin: excludeIds },
      $or: [
        { clubId: { $in: [...clubIds, ...institutionIds] } },
        { userId: { $in: friendIds } },
      ],
    };

    // Roughly 60% of the page from clubs/institutions/friends, the rest
    // random discovery — adjust the split to taste.
    const personalizedQuota = Math.ceil(limit * 0.6);
    const discoveryQuota = limit - personalizedQuota;

    const personalized = clubIds.length || institutionIds.length || friendIds.length
      ? await Story.aggregate([
          { $match: personalizedFilter },
          { $sample: { size: personalizedQuota } },
        ])
      : [];

    const seenIds = [...excludeIds, ...personalized.map((s) => s._id)];

    const discovery = await Story.aggregate([
      {
        $match: {
          _id: { $nin: seenIds },
          userId: { $ne: userId }, // don't hand the user their own posts as "discovery"
        },
      },
      // Fill any shortfall from the personalized side (e.g. a brand-new
      // user with no clubs/friends yet) so the page still comes back full.
      { $sample: { size: discoveryQuota + (personalizedQuota - personalized.length) } },
    ]);

    // Interleave 1-for-1 rather than block-then-block.
    const combined = [];
    const max = Math.max(personalized.length, discovery.length);
    for (let i = 0; i < max; i++) {
      if (personalized[i]) combined.push(personalized[i]);
      if (discovery[i]) combined.push(discovery[i]);
    }

    // $sample/aggregate bypass .populate(), so populate after the fact.
    const populated = await Story.populate(combined, [
      { path: "userId", select: "username displayName imageUrl" },
      { path: "clubId", select: "clubName image" },
    ]);

    res.status(200).json({
      data: populated,
      meta: {
        limit,
        returned: populated.length,
        // Hand this straight back as `excludeIds` on the next page request.
        nextExcludeIds: [...excludeIds, ...populated.map((s) => s._id)].map((id) =>
          id.toString()
        ),
      },
    });
  } catch (error) {
    console.error("Get home feed error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateStory = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { title, authorId, blocks } = req.body;

    const updatedStory = await Story.findOneAndUpdate(
      { topicId },
      { title, authorId, blocks },
      { new: true, runValidators: true }
    );

    if (!updatedStory) {
      return res.status(404).json({ message: "Story not found" });
    }

    res.status(200).json(updatedStory);
  } catch (error) {
    console.error("Update story error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getStoryById = async (req, res) => {
  try {
    const { storyId } = req.params;

    if (!storyId) {
      return res.status(400).json({ message: "storyId is required" });
    }

    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    res.status(200).json({ data: story });
  } catch (error) {
    console.error("Get story by id error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid storyId" });
    }

    res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH a story (partial update)
export const patchStory = async (req, res) => {
  try {
    const { topicId } = req.params;
    const updateData = req.body; // could be partial (title, blocks, etc.)

    const patchedStory = await Story.findOneAndUpdate(
      { topicId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!patchedStory) {
      return res.status(404).json({ message: "Story not found" });
    }

    res.status(200).json(patchedStory);
  } catch (error) {
    console.error("Patch story error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE a story by topicId
export const deleteStory = async (req, res) => {
  try {
    const { topicId } = req.params;

    const deletedStory = await Story.findOneAndDelete({ topicId });
    if (!deletedStory) {
      return res.status(404).json({ message: "Story not found" });
    }

    res.status(200).json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error("Delete story error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};