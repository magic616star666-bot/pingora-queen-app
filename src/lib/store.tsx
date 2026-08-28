import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type {
  Attachment,
  CallRecord,
  Chat,
  Community,
  ID,
  LinkedDevice,
  Message,
  MessageStatus,
  Settings,
  StatusUpdate,
  User,
} from "./types";
import { buildInitialState, ME_ID, sampleMe } from "./sample-data";
import { initialsOf } from "./format";

const LOCAL_KEY = "pingora.local.v2";

/** Rows shaped by the database (kept narrow so the store owns all mapping). */
interface ProfileRow {
  id: string;
  display_name: string;
  phone: string | null;
  about: string;
  avatar_url: string | null;
  hue: number;
  last_seen: string;
}
interface ConversationRow {
  id: string;
  kind: string;
  title: string | null;
  description: string | null;
  hue: number;
  created_by: string;
  last_message_at: string;
  created_at: string;
}
interface MemberRow {
  conversation_id: string;
  user_id: string;
  role: string;
  pinned: boolean;
  muted: boolean;
  archived: boolean;
  last_read_at: string;
}
interface MessageRow {
  id: string;
  conversation_id: string;
  author_id: string;
  body: string | null;
  attachment: unknown;
  reply_to_id: string | null;
  forwarded: boolean;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
}
interface ReactionRow {
  message_id: string;
  user_id: string;
  emoji: string;
}

/** Screens that are still UI-only keep their content here (device local). */
interface LocalState {
  statuses: StatusUpdate[];
  calls: CallRecord[];
  communities: Community[];
  devices: LinkedDevice[];
  blockedIds: ID[];
  settings: Settings;
  drafts: Record<ID, string>;
  starredIds: ID[];
  clearedAt: Record<ID, number>;
  demoMessages: Message[];
}

export type LoadStatus = "loading" | "ready" | "error";

interface StoreValue {
  ready: boolean;
  authed: boolean;
  loadStatus: LoadStatus;
  loadError: string | null;
  reload: () => Promise<void>;
  me: User;
  meId: ID;
  users: Record<ID, User>;
  contacts: User[];
  chats: Chat[];
  messages: Message[];
  statuses: StatusUpdate[];
  calls: CallRecord[];
  communities: Community[];
  devices: LinkedDevice[];
  blockedIds: ID[];
  settings: Settings;

  signUpWithEmail: (input: {
    email: string;
    password: string;
    name: string;
    phone: string;
  }) => Promise<{ needsConfirmation: boolean }>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => void;
  sendMessage: (
    chatId: ID,
    input: {
      text?: string | undefined;
      attachment?: Attachment | undefined;
      replyToId?: ID | undefined;
    },
  ) => Promise<void>;
  editMessage: (id: ID, text: string) => Promise<void>;
  deleteMessage: (id: ID) => Promise<void>;
  toggleReaction: (id: ID, emoji: string) => Promise<void>;
  toggleStar: (id: ID) => void;
  forwardMessage: (id: ID, chatIds: ID[]) => Promise<void>;
  markChatRead: (chatId: ID) => void;
  setDraft: (chatId: ID, draft: string) => void;
  patchChat: (chatId: ID, patch: Partial<Chat>) => void;
  createGroup: (name: string, memberIds: ID[], description?: string | undefined) => Promise<string>;
  leaveChat: (chatId: ID) => Promise<void>;
  clearChat: (chatId: ID) => void;
  addStatus: (text: string) => void;
  viewStatus: (id: ID) => void;
  logCall: (userId: ID, kind: "voice" | "video", durationSec: number) => void;
  toggleBlock: (userId: ID) => void;
  removeDevice: (id: ID) => void;
  chatTitle: (chat: Chat) => string;
  chatHue: (chat: Chat) => number;
  chatPartner: (chat: Chat) => User | undefined;
  lastMessage: (chatId: ID) => Message | undefined;
  messagesOf: (chatId: ID) => Message[];
  findChatWithUser: (userId: ID) => Chat | undefined;
  openDmWith: (userId: ID) => Promise<string>;
}

const StoreContext = createContext<StoreValue | null>(null);

function buildLocalState(): LocalState {
  const seed = buildInitialState();
  const demoChatIds = new Set(seed.chats.filter((c) => c.communityId).map((c) => c.id));
  return {
    statuses: seed.statuses,
    calls: seed.calls,
    communities: seed.communities,
    devices: seed.devices,
    blockedIds: [],
    settings: seed.settings,
    drafts: {},
    starredIds: [],
    clearedAt: {},
    demoMessages: seed.messages.filter((m) => demoChatIds.has(m.chatId)),
  };
}

const demoChats: Chat[] = buildInitialState()
  .chats.filter((c) => c.communityId)
  .map((c) => ({ ...c, demo: true, memberIds: c.memberIds }));

const sampleUsers = buildInitialState().users;

function toUser(row: ProfileRow, online: boolean): User {
  return {
    id: row.id,
    name: row.display_name,
    phone: row.phone ?? "",
    about: row.about,
    avatar: row.avatar_url ?? undefined,
    initials: initialsOf(row.display_name),
    hue: row.hue,
    online,
    lastSeen: Date.parse(row.last_seen),
  };
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [local, setLocal] = useState<LocalState>(() => buildLocalState());
  const [ready, setReady] = useState(false);

  const [meId, setMeId] = useState<ID | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [convRows, setConvRows] = useState<ConversationRow[]>([]);
  const [memberRows, setMemberRows] = useState<MemberRow[]>([]);
  const [messageRows, setMessageRows] = useState<MessageRow[]>([]);
  const [reactionRows, setReactionRows] = useState<ReactionRow[]>([]);
  const [pending, setPending] = useState<Message[]>([]);
  const [onlineIds, setOnlineIds] = useState<string[]>([]);
  const [typingIn, setTypingIn] = useState<Record<ID, number>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  /* ---------------------------------------------------------------- local */

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<LocalState>;
        setLocal((base) => ({ ...base, ...parsed, settings: { ...base.settings, ...parsed.settings } }));
      }
    } catch {
      /* corrupt local state — keep defaults */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(local));
    } catch {
      /* storage unavailable */
    }
  }, [local, ready]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", local.settings.theme === "dark");
    root.style.colorScheme = local.settings.theme;
  }, [local.settings.theme]);

  /* ----------------------------------------------------------------- auth */

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setMeId(session?.user.id ?? null);
      setAuthResolved(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setMeId(data.session?.user.id ?? null);
      setAuthResolved(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  /* ----------------------------------------------------------------- load */

  const load = useCallback(async () => {
    if (!meId) return;
    setLoadStatus("loading");
    setLoadError(null);
    const [p, c, m, msg, rx] = await Promise.all([
      supabase.from("profiles").select("id,display_name,phone,about,avatar_url,hue,last_seen"),
      supabase.from("conversations").select("*"),
      supabase.from("conversation_members").select("*"),
      supabase.from("messages").select("*").order("created_at", { ascending: true }).limit(1000),
      supabase.from("message_reactions").select("message_id,user_id,emoji"),
    ]);
    const err = p.error ?? c.error ?? m.error ?? msg.error ?? rx.error;
    if (err) {
      setLoadStatus("error");
      setLoadError(err.message);
      return;
    }
    setProfiles((p.data ?? []) as ProfileRow[]);
    setConvRows((c.data ?? []) as ConversationRow[]);
    setMemberRows((m.data ?? []) as MemberRow[]);
    setMessageRows((msg.data ?? []) as MessageRow[]);
    setReactionRows((rx.data ?? []) as ReactionRow[]);
    setLoadStatus("ready");
  }, [meId]);

  // Ensure a profile row exists for the signed-in user, then load everything.
  useEffect(() => {
    if (!meId) {
      setProfiles([]);
      setConvRows([]);
      setMemberRows([]);
      setMessageRows([]);
      setReactionRows([]);
      setPending([]);
      if (authResolved) setLoadStatus("ready");
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data: user } = await supabase.auth.getUser();
      const meta = (user.user?.user_metadata ?? {}) as { name?: string; phone?: string };
      const { data: existing } = await supabase.from("profiles").select("id").eq("id", meId).maybeSingle();
      if (!existing) {
        await supabase.from("profiles").insert({
          id: meId,
          display_name: meta.name?.trim() || user.user?.email?.split("@")[0] || "New user",
          phone: meta.phone ?? null,
          hue: Math.floor(Math.random() * 360),
        });
      }
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [meId, authResolved, load]);

  /* ------------------------------------------------------------- realtime */

  useEffect(() => {
    if (!meId) return;
    const channel = supabase.channel("pingora-room", { config: { presence: { key: meId } } });
    channelRef.current = channel;

    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const row = payload.new as MessageRow;
          setMessageRows((rows) => (rows.some((r) => r.id === row.id) ? rows : [...rows, row]));
          setPending((list) => list.filter((m) => m.id !== row.id));
        } else if (payload.eventType === "UPDATE") {
          const row = payload.new as MessageRow;
          setMessageRows((rows) => rows.map((r) => (r.id === row.id ? row : r)));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, () => {
        void supabase
          .from("message_reactions")
          .select("message_id,user_id,emoji")
          .then(({ data }) => data && setReactionRows(data as ReactionRow[]));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        void supabase
          .from("conversations")
          .select("*")
          .then(({ data }) => data && setConvRows(data as ConversationRow[]));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversation_members" }, () => {
        void supabase
          .from("conversation_members")
          .select("*")
          .then(({ data }) => data && setMemberRows(data as MemberRow[]));
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const p = payload as { conversationId: string; userId: string };
        if (p.userId === meId) return;
        setTypingIn((t) => ({ ...t, [p.conversationId]: Date.now() }));
      })
      .on("presence", { event: "sync" }, () => {
        setOnlineIds(Object.keys(channel.presenceState()));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void channel.track({ at: Date.now() });
      });

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [meId]);

  // Expire typing indicators.
  useEffect(() => {
    if (Object.keys(typingIn).length === 0) return;
    const t = setInterval(() => {
      setTypingIn((cur) => {
        const next: Record<ID, number> = {};
        let changed = false;
        for (const [k, v] of Object.entries(cur)) {
          if (Date.now() - v < 4000) next[k] = v;
          else changed = true;
        }
        return changed ? next : cur;
      });
    }, 1500);
    return () => clearInterval(t);
  }, [typingIn]);

  // Keep last_seen fresh while the app is open.
  useEffect(() => {
    if (!meId) return;
    const beat = () =>
      void supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", meId);
    beat();
    const t = setInterval(beat, 60_000);
    return () => clearInterval(t);
  }, [meId]);

  /* -------------------------------------------------------------- derived */

  const value = useMemo<StoreValue>(() => {
    const onlineSet = new Set(onlineIds);
    const realUsers: Record<ID, User> = {};
    for (const row of profiles) realUsers[row.id] = toUser(row, onlineSet.has(row.id));

    const me: User = meId
      ? (realUsers[meId] ?? { ...sampleMe, id: meId, name: "You" })
      : { ...sampleMe, id: ME_ID };

    const users: Record<ID, User> = { ...sampleUsers, ...realUsers, ...(meId ? { [meId]: me } : {}) };

    const membersOf = (convId: ID) => memberRows.filter((r) => r.conversation_id === convId);
    const myMember = (convId: ID) => memberRows.find((r) => r.conversation_id === convId && r.user_id === meId);

    const reactionsFor = (messageId: ID) =>
      reactionRows
        .filter((r) => r.message_id === messageId)
        .map((r) => ({ emoji: r.emoji, userId: r.user_id }));

    const statusOf = (row: MessageRow): MessageStatus => {
      if (row.author_id !== meId) return "read";
      const others = membersOf(row.conversation_id).filter((m) => m.user_id !== meId);
      if (others.length === 0) return "sent";
      const created = Date.parse(row.created_at);
      const allRead = others.every((m) => Date.parse(m.last_read_at) >= created);
      return allRead ? "read" : "delivered";
    };

    const toMessage = (row: MessageRow): Message => ({
      id: row.id,
      chatId: row.conversation_id,
      authorId: row.author_id,
      text: row.deleted_at ? undefined : (row.body ?? undefined),
      attachment: row.deleted_at ? undefined : ((row.attachment as Attachment | null) ?? undefined),
      replyToId: row.reply_to_id ?? undefined,
      createdAt: Date.parse(row.created_at),
      status: statusOf(row),
      reactions: row.deleted_at ? [] : reactionsFor(row.id),
      edited: !!row.edited_at,
      deleted: !!row.deleted_at,
      forwarded: row.forwarded,
      starred: local.starredIds.includes(row.id),
    });

    const realMessages = messageRows
      .filter((r) => Date.parse(r.created_at) > (local.clearedAt[r.conversation_id] ?? 0))
      .map(toMessage);

    const messages: Message[] = [...realMessages, ...pending, ...local.demoMessages];

    const messagesOf = (chatId: ID) =>
      messages.filter((m) => m.chatId === chatId).sort((a, b) => a.createdAt - b.createdAt);

    const lastMessage = (chatId: ID) => {
      const list = messagesOf(chatId);
      return list[list.length - 1];
    };

    const realChats: Chat[] = convRows
      .filter((row) => !!myMember(row.id))
      .map((row) => {
        const mine = myMember(row.id)!;
        const members = membersOf(row.id);
        const readAt = Date.parse(mine.last_read_at);
        const unread = messageRows.filter(
          (m) => m.conversation_id === row.id && m.author_id !== meId && Date.parse(m.created_at) > readAt,
        ).length;
        return {
          id: row.id,
          kind: row.kind === "group" ? "group" : "dm",
          name: row.title ?? undefined,
          description: row.description ?? undefined,
          hue: row.hue,
          memberIds: members.map((m) => m.user_id),
          adminIds: members.filter((m) => m.role === "admin").map((m) => m.user_id),
          pinned: mine.pinned,
          muted: mine.muted,
          archived: mine.archived,
          unreadCount: unread,
          draft: local.drafts[row.id] ?? "",
          typing: !!typingIn[row.id],
          createdAt: Date.parse(row.created_at),
        } satisfies Chat;
      });

    const chats: Chat[] = [
      ...realChats,
      ...demoChats.map((c) => ({ ...c, draft: local.drafts[c.id] ?? "" })),
    ];

    const chatPartner = (chat: Chat) =>
      chat.kind === "dm" ? users[chat.memberIds.find((m) => m !== me.id) ?? ""] : undefined;

    const chatTitle = (chat: Chat) =>
      chat.kind === "group" ? (chat.name ?? "Group") : (chatPartner(chat)?.name ?? "Unknown");

    const chatHue = (chat: Chat) => chat.hue ?? chatPartner(chat)?.hue ?? 32;

    const requireMe = () => {
      if (!meId) throw new Error("You need to be signed in");
      return meId;
    };

    const fail = (message: string, error: { message: string }) => {
      console.error(message, error);
      toast.error(message, { description: error.message });
    };

    const isDemo = (chatId: ID) => demoChats.some((c) => c.id === chatId);

    return {
      ready,
      authed: !!meId,
      loadStatus: authResolved ? loadStatus : "loading",
      loadError,
      reload: load,
      me,
      meId: me.id,
      users,
      contacts: Object.values(realUsers).filter((u) => u.id !== meId),
      chats,
      messages,
      statuses: local.statuses,
      calls: local.calls,
      communities: local.communities,
      devices: local.devices,
      blockedIds: local.blockedIds,
      settings: local.settings,

      signUpWithEmail: async ({ email, password, name, phone }) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name, phone },
          },
        });
        if (error) throw error;
        return { needsConfirmation: !data.session };
      },
      signInWithEmail: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
      updateProfile: async (p) => {
        const id = requireMe();
        const patch: {
          display_name?: string;
          about?: string;
          phone?: string | null;
          avatar_url?: string | null;
        } = {};
        if (p.name !== undefined) patch.display_name = p.name;
        if (p.about !== undefined) patch.about = p.about;
        if (p.phone !== undefined) patch.phone = p.phone ?? null;
        if (p.avatar !== undefined) patch.avatar_url = p.avatar ?? null;
        if (Object.keys(patch).length === 0) return;
        const { error } = await supabase.from("profiles").update(patch).eq("id", id);
        if (error) return fail("Couldn't save your profile", error);
        setProfiles((rows) =>
          rows.map((r) =>
            r.id === id
              ? {
                  ...r,
                  display_name: patch.display_name ?? r.display_name,
                  about: patch.about ?? r.about,
                  phone: patch.phone !== undefined ? patch.phone : r.phone,
                  avatar_url: patch.avatar_url !== undefined ? patch.avatar_url : r.avatar_url,
                }
              : r,
          ),
        );

      },
      updateSettings: (p) => setLocal((s) => ({ ...s, settings: { ...s.settings, ...p } })),

      sendMessage: async (chatId, input) => {
        const id = requireMe();
        const messageId = uid();
        if (isDemo(chatId)) {
          setLocal((s) => ({
            ...s,
            drafts: { ...s.drafts, [chatId]: "" },
            demoMessages: [
              ...s.demoMessages,
              {
                id: messageId,
                chatId,
                authorId: id,
                text: input.text,
                attachment: input.attachment,
                replyToId: input.replyToId,
                createdAt: Date.now(),
                status: "sent",
                reactions: [],
              },
            ],
          }));
          return;
        }
        const optimistic: Message = {
          id: messageId,
          chatId,
          authorId: id,
          text: input.text,
          attachment: input.attachment,
          replyToId: input.replyToId,
          createdAt: Date.now(),
          status: "sending",
          reactions: [],
        };
        setPending((list) => [...list, optimistic]);
        setLocal((s) => ({ ...s, drafts: { ...s.drafts, [chatId]: "" } }));
        const { data, error } = await supabase
          .from("messages")
          .insert({
            id: messageId,
            conversation_id: chatId,
            author_id: id,
            body: input.text ?? null,
            attachment: input.attachment ? (input.attachment as never) : null,
            reply_to_id: input.replyToId ?? null,
          })
          .select("*")
          .single();
        if (error) {
          setPending((list) => list.filter((m) => m.id !== messageId));
          return fail("Message not sent", error);
        }
        setMessageRows((rows) =>
          rows.some((r) => r.id === messageId) ? rows : [...rows, data as MessageRow],
        );
        setPending((list) => list.filter((m) => m.id !== messageId));
      },
      editMessage: async (id, text) => {
        if (local.demoMessages.some((m) => m.id === id)) {
          setLocal((s) => ({
            ...s,
            demoMessages: s.demoMessages.map((m) => (m.id === id ? { ...m, text, edited: true } : m)),
          }));
          return;
        }
        const { error } = await supabase
          .from("messages")
          .update({ body: text, edited_at: new Date().toISOString() })
          .eq("id", id);
        if (error) return fail("Couldn't edit that message", error);
      },
      deleteMessage: async (id) => {
        if (local.demoMessages.some((m) => m.id === id)) {
          setLocal((s) => ({
            ...s,
            demoMessages: s.demoMessages.map((m) =>
              m.id === id ? { ...m, deleted: true, text: undefined, attachment: undefined, reactions: [] } : m,
            ),
          }));
          return;
        }
        const { error } = await supabase
          .from("messages")
          .update({ deleted_at: new Date().toISOString(), body: null, attachment: null })
          .eq("id", id);
        if (error) return fail("Couldn't delete that message", error);
      },
      toggleReaction: async (id, emoji) => {
        const meNow = requireMe();
        if (local.demoMessages.some((m) => m.id === id)) {
          setLocal((s) => ({
            ...s,
            demoMessages: s.demoMessages.map((m) => {
              if (m.id !== id) return m;
              const mine = m.reactions.find((r) => r.userId === meNow);
              const rest = m.reactions.filter((r) => r.userId !== meNow);
              return mine?.emoji === emoji
                ? { ...m, reactions: rest }
                : { ...m, reactions: [...rest, { emoji, userId: meNow }] };
            }),
          }));
          return;
        }
        const existing = reactionRows.find((r) => r.message_id === id && r.user_id === meNow);
        if (existing?.emoji === emoji) {
          setReactionRows((rows) => rows.filter((r) => !(r.message_id === id && r.user_id === meNow)));
          const { error } = await supabase
            .from("message_reactions")
            .delete()
            .eq("message_id", id)
            .eq("user_id", meNow);
          if (error) return fail("Couldn't remove that reaction", error);
          return;
        }
        setReactionRows((rows) => [
          ...rows.filter((r) => !(r.message_id === id && r.user_id === meNow)),
          { message_id: id, user_id: meNow, emoji },
        ]);
        const { error } = await supabase
          .from("message_reactions")
          .upsert({ message_id: id, user_id: meNow, emoji }, { onConflict: "message_id,user_id" });
        if (error) return fail("Couldn't add that reaction", error);
      },
      toggleStar: (id) =>
        setLocal((s) => ({
          ...s,
          starredIds: s.starredIds.includes(id)
            ? s.starredIds.filter((x) => x !== id)
            : [...s.starredIds, id],
        })),
      forwardMessage: async (id, chatIds) => {
        const meNow = requireMe();
        const source = messages.find((m) => m.id === id);
        if (!source) return;
        const targets = chatIds.filter((c) => !isDemo(c));
        if (targets.length === 0) return;
        const { error } = await supabase.from("messages").insert(
          targets.map((chatId) => ({
            conversation_id: chatId,
            author_id: meNow,
            body: source.text ?? null,
            attachment: source.attachment ? (source.attachment as never) : null,
            forwarded: true,
          })),
        );
        if (error) return fail("Couldn't forward that message", error);
      },
      markChatRead: (chatId) => {
        if (!meId || isDemo(chatId)) return;
        const stamp = new Date().toISOString();
        setMemberRows((rows) =>
          rows.map((r) =>
            r.conversation_id === chatId && r.user_id === meId ? { ...r, last_read_at: stamp } : r,
          ),
        );
        void supabase
          .from("conversation_members")
          .update({ last_read_at: stamp })
          .eq("conversation_id", chatId)
          .eq("user_id", meId);
      },
      setDraft: (chatId, draft) => {
        setLocal((s) => ({ ...s, drafts: { ...s.drafts, [chatId]: draft } }));
        if (!meId || !draft || isDemo(chatId)) return;
        const key = `typing:${chatId}`;
        if (typingTimers.current[key]) return;
        typingTimers.current[key] = setTimeout(() => {
          delete typingTimers.current[key];
        }, 2500);
        void channelRef.current?.send({
          type: "broadcast",
          event: "typing",
          payload: { conversationId: chatId, userId: meId },
        });
      },
      patchChat: (chatId, patch) => {
        if (!meId || isDemo(chatId)) return;
        if (patch.unreadCount === 0) {
          const stamp = new Date().toISOString();
          setMemberRows((rows) =>
            rows.map((r) =>
              r.conversation_id === chatId && r.user_id === meId ? { ...r, last_read_at: stamp } : r,
            ),
          );
          void supabase
            .from("conversation_members")
            .update({ last_read_at: stamp })
            .eq("conversation_id", chatId)
            .eq("user_id", meId);
        }
        const row: { pinned?: boolean; muted?: boolean; archived?: boolean } = {};
        if (patch.pinned !== undefined) row.pinned = patch.pinned;
        if (patch.muted !== undefined) row.muted = patch.muted;
        if (patch.archived !== undefined) row.archived = patch.archived;
        if (Object.keys(row).length === 0) return;
        setMemberRows((rows) =>
          rows.map((r) =>
            r.conversation_id === chatId && r.user_id === meId ? { ...r, ...row } : r,
          ),
        );
        void supabase
          .from("conversation_members")
          .update(row)
          .eq("conversation_id", chatId)
          .eq("user_id", meId)
          .then(({ error }) => {
            if (error) fail("Couldn't update that chat", error);
          });
      },
      createGroup: async (name, memberIds, description) => {
        requireMe();
        const { data, error } = await supabase.rpc("create_group", {
          _title: name,
          _member_ids: memberIds,
          ...(description ? { _description: description } : {}),
        });

        if (error) {
          fail("Couldn't create the group", error);
          throw error;
        }
        await load();
        return data as string;
      },
      leaveChat: async (chatId) => {
        if (!meId || isDemo(chatId)) return;
        const { error } = await supabase
          .from("conversation_members")
          .delete()
          .eq("conversation_id", chatId)
          .eq("user_id", meId);
        if (error) return fail("Couldn't leave that chat", error);
        setMemberRows((rows) => rows.filter((r) => !(r.conversation_id === chatId && r.user_id === meId)));
      },
      clearChat: (chatId) =>
        setLocal((s) => ({
          ...s,
          clearedAt: { ...s.clearedAt, [chatId]: Date.now() },
          demoMessages: s.demoMessages.filter((m) => m.chatId !== chatId),
        })),
      addStatus: (text) =>
        setLocal((s) => ({
          ...s,
          statuses: [
            { id: uid(), userId: ME_ID, createdAt: Date.now(), kind: "text", text, hue: 32 },
            ...s.statuses,
          ],
        })),
      viewStatus: (id) =>
        setLocal((s) => ({
          ...s,
          statuses: s.statuses.map((st) => (st.id === id ? { ...st, viewed: true } : st)),
        })),
      logCall: (userId, kind, durationSec) =>
        setLocal((s) => ({
          ...s,
          calls: [
            { id: uid(), userId, kind, direction: "outgoing", at: Date.now(), durationSec },
            ...s.calls,
          ],
        })),
      toggleBlock: (userId) =>
        setLocal((s) => ({
          ...s,
          blockedIds: s.blockedIds.includes(userId)
            ? s.blockedIds.filter((b) => b !== userId)
            : [...s.blockedIds, userId],
        })),
      removeDevice: (id) => setLocal((s) => ({ ...s, devices: s.devices.filter((d) => d.id !== id) })),
      chatTitle,
      chatHue,
      chatPartner,
      lastMessage,
      messagesOf,
      findChatWithUser: (userId) =>
        chats.find((c) => c.kind === "dm" && c.memberIds.includes(userId)),
      openDmWith: async (userId) => {
        requireMe();
        const existing = chats.find((c) => c.kind === "dm" && c.memberIds.includes(userId));
        if (existing) return existing.id;
        const { data, error } = await supabase.rpc("start_dm", { _other_user: userId });
        if (error) {
          fail("Couldn't start that chat", error);
          throw error;
        }
        await load();
        return data as string;
      },
    };
  }, [
    ready,
    meId,
    authResolved,
    loadStatus,
    loadError,
    load,
    profiles,
    convRows,
    memberRows,
    messageRows,
    reactionRows,
    pending,
    onlineIds,
    typingIn,
    local,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/** Sentinel id used by the local-only Updates/Calls sample content. */
export { ME_ID };
