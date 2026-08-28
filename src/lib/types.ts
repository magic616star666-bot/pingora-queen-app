export type ID = string;

export type MessageStatus = "sending" | "sent" | "delivered" | "read";

export type AttachmentKind = "image" | "video" | "document" | "voice" | "location" | "contact";

export interface Attachment {
  kind: AttachmentKind;
  name?: string | undefined;
  url?: string | undefined;
  size?: string | undefined;
  durationSec?: number | undefined;
  caption?: string | undefined;
}

export interface Reaction {
  emoji: string;
  userId: ID;
}

export interface Message {
  id: ID;
  chatId: ID;
  authorId: ID;
  text?: string | undefined;
  createdAt: number;
  status: MessageStatus;
  replyToId?: ID | undefined;
  reactions: Reaction[];
  edited?: boolean | undefined;
  deleted?: boolean | undefined;
  starred?: boolean | undefined;
  forwarded?: boolean | undefined;
  attachment?: Attachment | undefined;
  system?: boolean | undefined;
}

export interface User {
  id: ID;
  name: string;
  phone: string;
  about: string;
  avatar?: string | undefined;
  initials: string;
  hue: number;
  online?: boolean | undefined;
  lastSeen?: number | undefined;
  blocked?: boolean | undefined;
}

export type ChatKind = "dm" | "group";

export interface Chat {
  id: ID;
  kind: ChatKind;
  name?: string | undefined;
  description?: string | undefined;
  hue?: number | undefined;
  memberIds: ID[];
  adminIds?: ID[] | undefined;
  pinned?: boolean | undefined;
  archived?: boolean | undefined;
  muted?: boolean | undefined;
  unreadCount: number;
  draft?: string | undefined;
  typing?: boolean | undefined;
  createdAt: number;
  communityId?: ID | undefined;
  /** Local demo conversation (community topic previews) — not stored in the database. */
  demo?: boolean | undefined;
}

export interface StatusUpdate {
  id: ID;
  userId: ID;
  createdAt: number;
  kind: "text" | "photo";
  text?: string | undefined;
  hue?: number | undefined;
  viewed?: boolean | undefined;
}

export interface CallRecord {
  id: ID;
  userId: ID;
  kind: "voice" | "video";
  direction: "incoming" | "outgoing";
  missed?: boolean | undefined;
  at: number;
  durationSec?: number | undefined;
}

export interface Community {
  id: ID;
  name: string;
  description: string;
  hue: number;
  memberCount: number;
  groupIds: ID[];
}

export interface LinkedDevice {
  id: ID;
  name: string;
  platform: string;
  lastActive: number;
}

export interface Settings {
  theme: "light" | "dark";
  readReceipts: boolean;
  lastSeenVisibility: "everyone" | "contacts" | "nobody";
  profilePhotoVisibility: "everyone" | "contacts" | "nobody";
  aboutVisibility: "everyone" | "contacts" | "nobody";
  messageNotifications: boolean;
  groupNotifications: boolean;
  callRingtone: boolean;
  reactionNotifications: boolean;
  enterToSend: boolean;
  mediaAutoDownload: "never" | "wifi" | "always";
  fontSize: "small" | "medium" | "large";
  archiveKeepMuted: boolean;
  dataSaverCalls: boolean;
}

export interface AppState {
  authed: boolean;
  onboarded: boolean;
  me: User;
  users: Record<ID, User>;
  chats: Chat[];
  messages: Message[];
  statuses: StatusUpdate[];
  calls: CallRecord[];
  communities: Community[];
  devices: LinkedDevice[];
  blockedIds: ID[];
  settings: Settings;
}
