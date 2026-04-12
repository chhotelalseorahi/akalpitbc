import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: "*",
    credentials: false,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from "./routes/profile/user.routes.js";
 
 
import Story from "./routes/notesStory/story.routes.js";
import Club from "./routes/clubs/club.routes.js";
import ClubPosts from "./routes/clubs/clubposts.route.js";
import errorHandler from "./middleware/error.middleware.js";

import { ParagraphBlock } from "./models/story/supporterTypes/paragraph.model.js";
import { HeadingBlock } from "./models/story/supporterTypes/heading.model.js";
import { PoetryBlock } from "./models/story/supporterTypes/poetry.model.js";
import { TableBlock } from "./models/story/supporterTypes/table.model.js";
import { TimelineBlock } from "./models/story/supporterTypes/timeliner.model.js";
import { SidenoteBlock } from "./models/story/supporterTypes/sidenotes.model.js";
import { ListBlock } from "./models/story/supporterTypes/list.model.js";
import { DividerBlock } from "./models/story/supporterTypes/divider.model.js";
import { QuoteBlock } from "./models/story/supporterTypes/quote.model.js";
import { ImageBloc } from "./models/story/supporterTypes/image.model.js";
import { MCQBlock } from "./models/story/supporterTypes/mcqs.model.js";

import Events from "./routes/events/events.route.js";
import uploadRoutes from "./routes/others/upload.routes.js";
import Activity from "./routes/events/activity/activity.routes.js";
import Participation from "./routes/events/activity/participation.route.js";
import Profile from "./routes/profile/profile.routes.js";
import { publicProfileRouter, freelancerRoutes } from "./routes/profile/publicProfile.routes.js";
import Connections from "./routes/connections/userToUser.route.js";
import Membership from "./routes/connections/userToClub.route.js";
import IProfile from "./routes/institution/profile.routes.js";
import IServices from "./routes/institution/services.routes.js";
import IBooking from "./routes/institution/booking.routes.js";
import Location from "./routes/others/location.routes.js";
import Categories from "./routes/others/categories.routes.js";
import Conversations from "./routes/connections/conversation.route.js";
import messages from "./routes/connections/message.route.js";
import councilRoutes from "./routes/clubs/council.routes.js";
import institutionRoutes from "./routes/institution/profile.routes.js";
import serviceRoutes     from "./routes/institution/services.routes.js";
import bookingRoutes     from "./routes/institution/booking.routes.js";

 import cartRoutes from "./routes/institution/cart.routes.js";
 import requestRoutes from "./routes/request/requestCenter.routes.js";
 import sponsorshipRouter from "./routes/sponsorship/sponsorship.routes.js";
 import feedRouter from "./routes/feed.routes.js";
 import eventDiscoverRouter from "./routes/events/eventDiscovery.routes.js";
 import paymentRouter from "./routes/payment.routes.js";
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/events/discover", eventDiscoverRouter);
app.use("/api/v1/feed", feedRouter);
app.use("/api/v1/sponsorships", sponsorshipRouter);
app.use("/api/v1/requests", requestRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/institutions",              institutionRoutes);
app.use("/api/v1/institutions/:institutionId/services", serviceRoutes);
app.use("/api/v1/bookings",                  bookingRoutes);
app.use("/api/v1/councils", councilRoutes);
app.use("/api/v1/auth", userRouter);
app.use("/api/v1/profile", Profile);
app.use("/api/v1/profile/public", publicProfileRouter);
app.use("/api/v1/freelancers",    freelancerRoutes);
app.use("/api/v1/club/posts", ClubPosts);
app.use("/api/v1/club", Club);
app.use("/api/v1/events",Events);
app.use("/api/v1/events/activity/",Activity);
app.use("/api/v1/events/participation/",Participation);
app.use("/api/v1/uploads", uploadRoutes);
app.use("/api/v1/connections",Connections);
app.use("/api/v1/membership",Membership);
app.use("/api/v1/stories", Story);
app.use("/api/v1/location", Location);
app.use("/api/v1/categories", Categories);
app.use("/api/v1/conversations", Conversations);
app.use("/api/v1/messages", messages);

app.use("/api/v1/institution/profile", IProfile );
app.use("/api/v1/institution/services", IServices );
app.use("/api/v1/institution/bookings", IBooking );

// ─────────────────────────────────────────────────────────────────────────────
// DEEP LINKS
// ─────────────────────────────────────────────────────────────────────────────

// Android verifies this URL to confirm you own the domain.
// This makes links open the app directly instead of the browser.
app.get("/.well-known/assetlinks.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.amiable_ventures.akalpit",
        sha256_cert_fingerprints: [
          "B1:E5:B4:B0:D5:DC:D7:8C:DC:0C:03:E2:B9:F1:53:95:78:74:27:DD:DC:DB:80:FF:E0:CA:C9:6E:12:B1:C1:4C",
        ],
      },
    },
  ]);
});

// Fallback page shown when the app is NOT installed.
// When app IS installed, Android intercepts the link before this page loads.
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.amiable_ventures.akalpit";

function deepLinkPage({ title, description, path }) {
  const appUrl = `https://api.akalpit.in${path}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} – Akalpit</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="https://api.akalpit.in/og-cover.png" />
  <meta property="og:url" content="${appUrl}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0E0E0E; color: #fff;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      min-height: 100vh; padding: 24px; text-align: center;
    }
    .logo { width: 80px; height: 80px; border-radius: 20px; margin-bottom: 24px; }
    h1 { font-size: 22px; font-weight: 600; margin-bottom: 8px; }
    p  { font-size: 15px; color: #888; margin-bottom: 32px; line-height: 1.5; }
    .btn {
      display: inline-block; padding: 14px 28px;
      background: #2196F3; color: #fff;
      border-radius: 12px; text-decoration: none;
      font-size: 16px; font-weight: 600;
    }
    .btn:hover { background: #1976D2; }
    .sub { margin-top: 16px; font-size: 13px; color: #555; }
  </style>
</head>
<body>
  <img src="https://api.akalpit.in/logo.png" alt="Akalpit" class="logo" onerror="this.style.display='none'" />
  <h1>${title}</h1>
  <p>${description}</p>
  <a href="${PLAY_STORE_URL}" class="btn">📲 Get Akalpit</a>
  <p class="sub">Already have the app? <a href="${appUrl}" style="color:#2196F3">Open link</a></p>
</body>
</html>`;
}

app.get("/profile/:userId", (req, res) => {
  res.send(deepLinkPage({
    title: "View Profile on Akalpit",
    description: "Open this profile in the Akalpit app to connect and collaborate.",
    path: `/profile/${req.params.userId}`,
  }));
});

app.get("/clubs/:clubId", (req, res) => {
  res.send(deepLinkPage({
    title: "Join this Club on Akalpit",
    description: "Discover clubs, events, and teams on Akalpit.",
    path: `/clubs/${req.params.clubId}`,
  }));
});

app.get("/events/:eventId", (req, res) => {
  res.send(deepLinkPage({
    title: "Check out this Event on Akalpit",
    description: "Participate in events and competitions near you.",
    path: `/events/${req.params.eventId}`,
  }));
});

app.get("/stories/:storyId", (req, res) => {
  res.send(deepLinkPage({
    title: "Read this Story on Akalpit",
    description: "Stories, notes, and memories from campus.",
    path: `/stories/${req.params.storyId}`,
  }));
});

app.get("/institution/:institutionId", (req, res) => {
  res.send(deepLinkPage({
    title: "View Institution on Akalpit",
    description: "Book services and explore institutions on Akalpit.",
    path: `/institution/${req.params.institutionId}`,
  }));
});

// ─────────────────────────────────────────────────────────────────────────────

app.use(errorHandler);
export { app };