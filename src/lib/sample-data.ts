import type { AppState, Chat, Message, User } from "./types";
import { initialsOf } from "./format";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const now = Date.now();

function user(
  id: string,
  name: string,
  phone: string,
  about: string,
  hue: number,
  online = false,
  lastSeenAgo = 3 * HOUR,
): User {
  return {
    id,
    name,
    phone,
    about,
    hue,
    initials: initialsOf(name),
    online,
    lastSeen: now - lastSeenAgo,
  };
}

export const ME_ID = "me";

const people: User[] = [
  user("u1", "Naledi Mokoena", "+27 82 114 8890", "Designing in the dark 🌙", 12, true),
  user("u2", "Rafael Duarte", "+55 11 95412 7783", "Coffee first, then chaos", 205, false, 22 * MIN),
  user("u3", "Amara Chen", "+65 8123 4471", "On a boat somewhere", 155, true),
  user("u4", "Tobias Lindqvist", "+46 70 998 1123", "Runner. Reader. Dad.", 85, false, 5 * HOUR),
  user("u5", "Priya Raghunathan", "+91 98450 22110", "Available", 285, false, 2 * DAY),
  user("u6", "Yusuf Demir", "+90 532 447 1180", "Building things that ping", 32, true),
  user("u7", "Elena Marino", "+39 340 118 9922", "Ciao! 🍋", 50, false, 40 * MIN),
  user("u8", "Kofi Mensah", "+233 24 771 0092", "Sound engineer", 250, false, 9 * HOUR),
  user("u9", "Hana Ito", "+81 90 7788 2211", "少しずつ", 330, false, 30 * HOUR),
];

export const sampleMe: User = {
  id: ME_ID,
  name: "Alex Rivera",
  phone: "+1 415 555 0142",
  about: "Pinging from the coast 🌊",
  hue: 32,
  initials: "AR",
  online: true,
  lastSeen: now,
};

function chat(partial: Partial<Chat> & { id: string; memberIds: string[] }): Chat {
  return {
    kind: "dm",
    unreadCount: 0,
    createdAt: now - 30 * DAY,
    ...partial,
  } as Chat;
}

const chats: Chat[] = [
  chat({ id: "c1", memberIds: [ME_ID, "u1"], pinned: true, unreadCount: 2 }),
  chat({ id: "c2", memberIds: [ME_ID, "u2"] }),
  chat({
    id: "c3",
    kind: "group",
    name: "Rooftop Supper Club",
    description: "Monthly dinners, rotating hosts. Bring a dish and a story.",
    hue: 205,
    memberIds: [ME_ID, "u1", "u3", "u4", "u7"],
    adminIds: [ME_ID, "u3"],
    pinned: true,
    unreadCount: 5,
  }),
  chat({ id: "c4", memberIds: [ME_ID, "u3"], muted: true }),
  chat({
    id: "c5",
    kind: "group",
    name: "Trail Crew 🥾",
    description: "Saturday hikes. No drop rides.",
    hue: 155,
    memberIds: [ME_ID, "u4", "u6", "u8"],
    adminIds: ["u4"],
  }),
  chat({ id: "c6", memberIds: [ME_ID, "u5"], unreadCount: 1 }),
  chat({ id: "c7", memberIds: [ME_ID, "u6"] }),
  chat({ id: "c8", memberIds: [ME_ID, "u7"], archived: true }),
  chat({ id: "c9", memberIds: [ME_ID, "u8"], archived: true, muted: true }),
  chat({ id: "c10", memberIds: [ME_ID, "u9"] }),
  chat({
    id: "cm1",
    kind: "group",
    name: "Harbour District · Announcements",
    description: "Read-only updates for the neighbourhood.",
    hue: 250,
    memberIds: [ME_ID, "u1", "u2", "u5"],
    adminIds: ["u5"],
    communityId: "comm1",
  }),
  chat({
    id: "cm2",
    kind: "group",
    name: "Harbour District · Lost & Found",
    hue: 85,
    memberIds: [ME_ID, "u2", "u7"],
    adminIds: ["u5"],
    communityId: "comm1",
  }),
  chat({
    id: "cm3",
    kind: "group",
    name: "Indie Devs · Ship It",
    description: "Weekly shipping threads.",
    hue: 285,
    memberIds: [ME_ID, "u6", "u9"],
    adminIds: ["u6"],
    communityId: "comm2",
  }),
];

let mid = 0;
function msg(
  chatId: string,
  authorId: string,
  text: string | undefined,
  minutesAgo: number,
  extra: Partial<Message> = {},
): Message {
  mid += 1;
  return {
    id: `m${mid}`,
    chatId,
    authorId,
    text,
    createdAt: now - minutesAgo * MIN,
    status: authorId === ME_ID ? "read" : "read",
    reactions: [],
    ...extra,
  };
}

const messages: Message[] = [
  // c1 — Naledi
  msg("c1", "u1", "Morning! Did you see the new Pingora build?", 320),
  msg("c1", ME_ID, "Just installed it. The status ring animation is unreal 😍", 316),
  msg("c1", "u1", undefined, 300, {
    attachment: { kind: "image", name: "aurora-mock.png", caption: "Sketch for the call screen" },
  }),
  msg("c1", ME_ID, "That gradient is going straight into the deck.", 297, {
    reactions: [{ emoji: "🔥", userId: "u1" }],
  }),
  msg("c1", "u1", "Can you review the handoff before 5?", 14),
  msg("c1", "u1", "No rush if you're deep in something.", 12),

  // c2 — Rafael
  msg("c2", ME_ID, "Coffee tomorrow at 8?", 700, { status: "read" }),
  msg("c2", "u2", "8:15 and I'm in ☕", 690),
  msg("c2", ME_ID, "Deal.", 688, { status: "delivered" }),
  msg("c2", "u2", undefined, 120, {
    attachment: { kind: "voice", durationSec: 27 },
  }),

  // c3 — Rooftop Supper Club
  msg("c3", "u3", undefined, 900, { system: true, text: "Amara Chen created this group" }),
  msg("c3", "u3", "Hosting this month! Theme: citrus + smoke 🍊", 480),
  msg("c3", "u7", "I'll bring the lemon tart. Non-negotiable.", 470, {
    reactions: [
      { emoji: "😂", userId: "u1" },
      { emoji: "❤️", userId: "u4" },
    ],
  }),
  msg("c3", "u4", undefined, 300, {
    attachment: { kind: "document", name: "supper-club-menu.pdf", size: "412 KB" },
  }),
  msg("c3", "u1", "Adding a playlist. Loud but civilised.", 200),
  msg("c3", ME_ID, "Count me in for two.", 190, { status: "read" }),
  msg("c3", "u3", "Saturday 7pm. Door code 4412.", 35),
  msg("c3", "u7", "Bringing my sister, that ok?", 30),
  msg("c3", "u4", "Always.", 28),
  msg("c3", "u1", "See you all there ✨", 20),
  msg("c3", "u3", undefined, 18, {
    attachment: { kind: "location", name: "Rooftop, 14 Harbour Lane" },
  }),

  // c4 — Amara
  msg("c4", "u3", "Boarding now, back Thursday.", 1500),
  msg("c4", ME_ID, "Safe travels! Send a sunset.", 1490, { status: "read" }),
  msg("c4", "u3", undefined, 1400, { attachment: { kind: "image", caption: "As requested 🌅" } }),

  // c5 — Trail Crew
  msg("c5", "u4", "Saturday 6am, Ridge lot. Rain or not.", 2000),
  msg("c5", "u6", "6am is a personality choice.", 1990, {
    reactions: [{ emoji: "😂", userId: "u8" }],
  }),
  msg("c5", "u8", undefined, 1900, { attachment: { kind: "video", name: "ridge-descent.mp4" } }),
  msg("c5", ME_ID, "I'll drive. Two seats free.", 1800, { status: "delivered" }),

  // c6 — Priya
  msg("c6", "u5", "Invoice sorted, thank you!", 60),
  msg("c6", "u5", "Also — are you free for a 15 min call Friday?", 58),

  // c7 — Yusuf
  msg("c7", "u6", "Pushed the realtime layer. Feels instant.", 800),
  msg("c7", ME_ID, "Testing now 🚀", 795, { status: "read" }),
  msg("c7", "u6", "Voice notes next.", 400),

  // c8 — Elena (archived)
  msg("c8", "u7", "Grazie for yesterday!", 4000),
  msg("c8", ME_ID, "Anytime 🙌", 3990, { status: "read" }),

  // c9 — Kofi (archived)
  msg("c9", "u8", "Stems are in the drive.", 6000),

  // c10 — Hana
  msg("c10", "u9", "Sent the translation draft.", 2600),
  msg("c10", ME_ID, "Reading tonight. Thank you!", 2590, { status: "read" }),

  // community chats
  msg("cm1", "u5", "Water works on Pier Rd, Tue 9–2. Plan around it.", 500),
  msg("cm1", "u1", "Thanks for the heads up.", 480),
  msg("cm2", "u2", undefined, 300, {
    attachment: { kind: "image", caption: "Found: grey cat, very smug" },
  }),
  msg("cm3", "u6", "Shipping thread #14 is open. Post your wins.", 260),
  msg("cm3", "u9", "Shipped a dark mode nobody asked for. Worth it.", 240, {
    reactions: [{ emoji: "🚀", userId: "u6" }],
  }),
];

export function buildInitialState(): AppState {
  return {
    authed: false,
    onboarded: false,
    me: sampleMe,
    users: Object.fromEntries(people.map((p) => [p.id, p])),
    chats,
    messages,
    statuses: [
      { id: "s1", userId: ME_ID, createdAt: now - 4 * HOUR, kind: "text", text: "Shipping day 🚀", hue: 32 },
      { id: "s2", userId: "u1", createdAt: now - 2 * HOUR, kind: "photo", hue: 205 },
      { id: "s3", userId: "u3", createdAt: now - 6 * HOUR, kind: "photo", hue: 155 },
      { id: "s4", userId: "u6", createdAt: now - 30 * MIN, kind: "text", text: "1.0 is out. Sleep next.", hue: 32 },
      { id: "s5", userId: "u7", createdAt: now - 20 * HOUR, kind: "photo", hue: 50, viewed: true },
      { id: "s6", userId: "u4", createdAt: now - 12 * HOUR, kind: "text", text: "42km. Legs gone.", hue: 85, viewed: true },
    ],
    calls: [
      { id: "k1", userId: "u1", kind: "video", direction: "incoming", at: now - 40 * MIN, durationSec: 754 },
      { id: "k2", userId: "u6", kind: "voice", direction: "outgoing", at: now - 5 * HOUR, durationSec: 122 },
      { id: "k3", userId: "u5", kind: "voice", direction: "incoming", missed: true, at: now - 26 * HOUR },
      { id: "k4", userId: "u3", kind: "video", direction: "outgoing", at: now - 2 * DAY, durationSec: 2410 },
      { id: "k5", userId: "u4", kind: "voice", direction: "outgoing", missed: true, at: now - 3 * DAY },
      { id: "k6", userId: "u2", kind: "voice", direction: "incoming", at: now - 4 * DAY, durationSec: 63 },
    ],
    communities: [
      {
        id: "comm1",
        name: "Harbour District",
        description: "Neighbours, notices and the occasional lost cat.",
        hue: 250,
        memberCount: 1284,
        groupIds: ["cm1", "cm2"],
      },
      {
        id: "comm2",
        name: "Indie Devs",
        description: "Builders shipping small software, loudly.",
        hue: 285,
        memberCount: 412,
        groupIds: ["cm3"],
      },
    ],
    devices: [
      { id: "d1", name: "Pingora Web", platform: "Chrome · macOS", lastActive: now - 10 * MIN },
      { id: "d2", name: "Pingora Desktop", platform: "Windows 11", lastActive: now - 3 * DAY },
    ],
    blockedIds: ["u9"],
    settings: {
      theme: "light",
      readReceipts: true,
      lastSeenVisibility: "contacts",
      profilePhotoVisibility: "everyone",
      aboutVisibility: "contacts",
      messageNotifications: true,
      groupNotifications: true,
      callRingtone: true,
      reactionNotifications: false,
      enterToSend: true,
      mediaAutoDownload: "wifi",
      fontSize: "medium",
      archiveKeepMuted: true,
      dataSaverCalls: false,
    },
  };
}

export const autoReplies = [
  "Ha, fair.",
  "On it 👌",
  "Give me ten minutes?",
  "That works for me.",
  "Wait, really?",
  "Sending it over now.",
  "Perfect timing.",
  "Let's do it 🚀",
];
