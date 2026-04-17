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
          // "4D:6E:79:93:2B:78:E0:8D:B0:DF:D0:99:65:31:C6:81:6B:16:64:66:AA:0B:A5:62:B9:51:AA:CA:34:39:E0:60",
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

const APP_STORE_URL  = "https://apps.apple.com/app/akalpit/id000000000"; // replace
const BASE_URL       = "https://api.akalpit.in";

function deepLinkPage({ title, description, path, imageUrl }) {
  const appUrl    = `${BASE_URL}${path}`;
  const ogImage   = imageUrl ?? `${BASE_URL}/og-cover.png`;
  const logoUrl   = `${BASE_URL}/logo.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} – Akalpit</title>

  <!-- Primary meta -->
  <meta name="description" content="${description}">

  <!-- Open Graph (WhatsApp, iMessage, Telegram, Facebook, LinkedIn) -->
  <meta property="og:site_name"   content="Akalpit" />
  <meta property="og:title"       content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image"       content="${ogImage}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url"         content="${appUrl}" />
  <meta property="og:type"        content="website" />

  <!-- Twitter / X cards -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image"       content="${ogImage}" />

  <!-- iOS Smart App Banner -->
  <meta name="apple-itunes-app" content="app-id=000000000, app-argument=${appUrl}">

  <!-- Preconnect for faster logo load -->
  <link rel="preconnect" href="${BASE_URL}">

  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --accent:      #6366f1;
      --accent-end:  #3b82f6;
      --accent-glow: rgba(99, 102, 241, 0.35);
      --surface:     #0d0d18;
      --card:        rgba(255,255,255,0.04);
      --border:      rgba(255,255,255,0.08);
      --text:        #f1f5f9;
      --muted:       rgba(255,255,255,0.45);
      --dim:         rgba(255,255,255,0.25);
    }

    @media (prefers-color-scheme: light) {
      :root {
        --accent-glow: rgba(99, 102, 241, 0.18);
        --surface:     #f5f5ff;
        --card:        rgba(0,0,0,0.03);
        --border:      rgba(0,0,0,0.07);
        --text:        #0f0f1a;
        --muted:       rgba(0,0,0,0.45);
        --dim:         rgba(0,0,0,0.25);
      }
    }

    html, body {
      height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--surface);
      color: var(--text);
      -webkit-font-smoothing: antialiased;
    }

    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 32px 20px;
      text-align: center;
    }

    /* — Ambient glow — */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background:
        radial-gradient(ellipse 60% 50% at 50% -10%, var(--accent-glow), transparent),
        radial-gradient(ellipse 40% 40% at 80% 90%,  rgba(59,130,246,0.12), transparent);
      pointer-events: none;
      z-index: 0;
    }

    .card {
      position: relative;
      z-index: 1;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 28px;
      padding: 40px 32px 32px;
      max-width: 380px;
      width: 100%;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }

    /* — App badge pill — */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      color: #a5b4fc;
      background: rgba(99,102,241,0.12);
      border: 1px solid rgba(99,102,241,0.25);
      padding: 5px 14px;
      border-radius: 99px;
      margin-bottom: 24px;
      letter-spacing: 0.2px;
    }
    .badge::before {
      content: '';
      display: block;
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #6ee7b7;
      box-shadow: 0 0 6px #6ee7b7;
      flex-shrink: 0;
    }

    /* — Logo — */
    .logo-ring {
      position: relative;
      width: 88px; height: 88px;
      margin: 0 auto 20px;
    }
    .logo-ring::before {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 26px;
      background: linear-gradient(135deg, var(--accent), var(--accent-end));
      opacity: 0.35;
      filter: blur(8px);
    }
    .logo-ring img {
      position: relative;
      width: 88px; height: 88px;
      border-radius: 22px;
      display: block;
    }
    .logo-fallback {
      position: relative;
      width: 88px; height: 88px;
      border-radius: 22px;
      background: linear-gradient(135deg, var(--accent), var(--accent-end));
      display: flex; align-items: center; justify-content: center;
      font-size: 36px; font-weight: 700; color: #fff;
    }

    /* — Text — */
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 8px;
      line-height: 1.25;
      letter-spacing: -0.3px;
    }
    .desc {
      font-size: 15px;
      color: var(--muted);
      margin-bottom: 32px;
      line-height: 1.55;
    }

    /* — Buttons — */
    .btn-primary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 15px 24px;
      background: linear-gradient(135deg, var(--accent), var(--accent-end));
      color: #fff;
      border: none;
      border-radius: 16px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: opacity .15s, transform .15s;
      box-shadow: 0 4px 24px var(--accent-glow);
      letter-spacing: 0.1px;
    }
    .btn-primary:hover  { opacity: 0.9; transform: translateY(-1px); }
    .btn-primary:active { opacity: 1;   transform: translateY(0); }

    .btn-ghost {
      display: block;
      width: 100%;
      margin-top: 12px;
      padding: 14px 24px;
      background: transparent;
      color: var(--muted);
      border: 1px solid var(--border);
      border-radius: 16px;
      font-size: 15px;
      font-weight: 500;
      text-decoration: none;
      transition: background .15s, color .15s, border-color .15s;
    }
    .btn-ghost:hover {
      background: var(--card);
      color: var(--text);
      border-color: rgba(255,255,255,0.16);
    }

    /* — Platform store strip — */
    .store-strip {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
    }
    .store-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--muted);
      font-size: 12px;
      font-weight: 500;
      text-decoration: none;
      transition: border-color .15s, color .15s;
    }
    .store-btn:hover { border-color: rgba(255,255,255,0.2); color: var(--text); }
    .store-btn svg { flex-shrink: 0; }

    /* — Footer — */
    .footer {
      margin-top: 28px;
      font-size: 12px;
      color: var(--dim);
      position: relative;
      z-index: 1;
    }
  </style>
</head>
<body>

  <div class="card">
    <div class="badge">Open in Akalpit</div>

    <div class="logo-ring">
      <img
        src="${logoUrl}"
        alt="Akalpit"
        onerror="this.outerHTML='<div class=\\'logo-fallback\\'>A</div>'"
      />
    </div>

    <h1>${title}</h1>
    <p class="desc">${description}</p>

    <!-- Primary CTA: detect platform and link accordingly -->
    <a href="${PLAY_STORE_URL}" class="btn-primary" id="cta">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3.18 23.18a1.5 1.5 0 0 1-1.5-1.5V2.32a1.5 1.5 0 0 1 2.25-1.3l18 9.68a1.5 1.5 0 0 1 0 2.6l-18 9.68a1.5 1.5 0 0 1-.75.2Z"/>
      </svg>
      Get the App
    </a>

    <a href="${appUrl}" class="btn-ghost" id="open-link">
      Already have it? Open in Akalpit →
    </a>

    <div class="store-strip">
      <a href="${PLAY_STORE_URL}" class="store-btn" id="android-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M1.22 0C.55 0 0 .55 0 1.22v21.56C0 23.45.55 24 1.22 24h.13L13 12 1.35.14A1.22 1.22 0 0 0 1.22 0Zm19.7 10.5-2.87-1.62L14.9 12l3.15 3.12 2.87-1.62a1.5 1.5 0 0 0 0-3Zm-4.38 4.72L4.3 23.5a1.22 1.22 0 0 0 1.7.14l12.34-6.8-2.8-1.62ZM6 .36 16.34 6.18l-2.8 2.8L4.3.5A1.22 1.22 0 0 1 6 .36Z"/></svg>
        Google Play
      </a>
      <a href="${APP_STORE_URL}" class="store-btn" id="ios-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
        App Store
      </a>
    </div>
  </div>

  <p class="footer">akalpit.in</p>

  <script>
    // Detect iOS vs Android and update the primary CTA link
    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const cta = document.getElementById('cta');
    const iosBtn = document.getElementById('ios-btn');
    const androidBtn = document.getElementById('android-btn');

    if (isIOS) {
      cta.href = '${APP_STORE_URL}';
      iosBtn.style.borderColor = 'rgba(99,102,241,0.5)';
      iosBtn.style.color = '#a5b4fc';
    } else {
      androidBtn.style.borderColor = 'rgba(99,102,241,0.5)';
      androidBtn.style.color = '#a5b4fc';
    }

    // Try to open the deep link first; fall back gracefully
    const openLink = document.getElementById('open-link');
    openLink.addEventListener('click', (e) => {
      e.preventDefault();
      const fallback = isIOS ? '${APP_STORE_URL}' : '${PLAY_STORE_URL}';
      const t = setTimeout(() => window.location.href = fallback, 1800);
      window.location.href = '${appUrl}';
      window.addEventListener('blur', () => clearTimeout(t));
    });
  </script>

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