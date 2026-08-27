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
import type {
  AppState,
  Attachment,
  Chat,
  ID,
  Message,
  Settings,
  StatusUpdate,
  User,
} from "./types";
import { buildInitialState, ME_ID, autoReplies } from "./sample-data";
import { initialsOf } from "./format";

const STORAGE_KEY = "pingora.state.v1";

/**
 * Local persistence layer. This is deliberately isolated behind one hook so the
 * same API can later be backed by a cloud database + realtime subscriptions
 * (see src/lib/backend-plan.md) without touching any screen.
 */
interface StoreValue extends AppState {
  ready: boolean;
  signIn: (name: string, phone: string) => void;
  signOut: () => void;
  completeOnboarding: () => void;
  updateProfile: (patch: Partial<User>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  sendMessage: (
    chatId: ID,
    input: { text?: string | undefined; attachment?: Attachment | undefined; replyToId?: ID | undefined },
  ) => void;
  editMessage: (id: ID, text: string) => void;
  deleteMessage: (id: ID) => void;
  toggleReaction: (id: ID, emoji: string) => void;
  toggleStar: (id: ID) => void;
  forwardMessage: (id: ID, chatIds: ID[]) => void;
  markChatRead: (chatId: ID) => void;
  setDraft: (chatId: ID, draft: string) => void;
  patchChat: (chatId: ID, patch: Partial<Chat>) => void;
  createGroup: (name: string, memberIds: ID[], description?: string | undefined) => string;
  leaveChat: (chatId: ID) => void;
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
  openDmWith: (userId: ID) => string;
}

const StoreContext = createContext<StoreValue | null>(null);

let seq = 0;
const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}${(seq += 1).toString(36)}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => buildInitialState());
  const [ready, setReady] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        setState((base) => ({ ...base, ...parsed, settings: { ...base.settings, ...parsed.settings } }));
      }
    } catch {
      /* ignore corrupt state */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable */
    }
  }, [state, ready]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", state.settings.theme === "dark");
    root.style.colorScheme = state.settings.theme;
  }, [state.settings.theme]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const patch = useCallback((fn: (s: AppState) => AppState) => setState(fn), []);

  const value = useMemo<StoreValue>(() => {
    const userOf = (id: ID): User | undefined => (id === ME_ID ? state.me : state.users[id]);

    const chatPartner = (chat: Chat) =>
      chat.kind === "dm" ? userOf(chat.memberIds.find((m) => m !== ME_ID) ?? "") : undefined;

    const chatTitle = (chat: Chat) =>
      chat.kind === "group" ? (chat.name ?? "Group") : (chatPartner(chat)?.name ?? "Unknown");

    const chatHue = (chat: Chat) => chat.hue ?? chatPartner(chat)?.hue ?? 32;

    const messagesOf = (chatId: ID) =>
      state.messages.filter((m) => m.chatId === chatId).sort((a, b) => a.createdAt - b.createdAt);

    const lastMessage = (chatId: ID) => {
      const list = messagesOf(chatId);
      return list[list.length - 1];
    };

    const simulateDelivery = (messageId: ID, chatId: ID) => {
      later(
        () =>
          patch((s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === messageId && m.status === "sending" ? { ...m, status: "sent" } : m,
            ),
          })),
        450,
      );
      later(
        () =>
          patch((s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === messageId ? { ...m, status: "delivered" } : m,
            ),
          })),
        1200,
      );
      later(
        () =>
          patch((s) => ({
            ...s,
            messages: s.messages.map((m) => (m.id === messageId ? { ...m, status: "read" } : m)),
          })),
        2600,
      );

      // Simulated realtime peer response for one-to-one chats.
      const chat = state.chats.find((c) => c.id === chatId);
      const partnerId = chat?.kind === "dm" ? chat.memberIds.find((m) => m !== ME_ID) : undefined;
      if (!partnerId || state.blockedIds.includes(partnerId)) return;
      later(() => patch((s) => ({ ...s, chats: s.chats.map((c) => (c.id === chatId ? { ...c, typing: true } : c)) })), 2000);
      later(() => {
        patch((s) => ({
          ...s,
          chats: s.chats.map((c) => (c.id === chatId ? { ...c, typing: false } : c)),
          messages: [
            ...s.messages,
            {
              id: uid("m"),
              chatId,
              authorId: partnerId,
              text: autoReplies[Math.floor(Math.random() * autoReplies.length)],
              createdAt: Date.now(),
              status: "read",
              reactions: [],
            },
          ],
        }));
      }, 4200);
    };

    return {
      ...state,
      ready,
      signIn: (name, phone) =>
        patch((s) => ({
          ...s,
          authed: true,
          onboarded: true,
          me: {
            ...s.me,
            name: name.trim() || s.me.name,
            phone: phone.trim() || s.me.phone,
            initials: initialsOf(name.trim() || s.me.name),
          },
        })),
      signOut: () => patch((s) => ({ ...s, authed: false })),
      completeOnboarding: () => patch((s) => ({ ...s, onboarded: true })),
      updateProfile: (p) =>
        patch((s) => ({
          ...s,
          me: { ...s.me, ...p, initials: initialsOf(p.name ?? s.me.name) },
        })),
      updateSettings: (p) => patch((s) => ({ ...s, settings: { ...s.settings, ...p } })),
      sendMessage: (chatId, input) => {
        const id = uid("m");
        patch((s) => ({
          ...s,
          chats: s.chats.map((c) => (c.id === chatId ? { ...c, draft: "", archived: false } : c)),
          messages: [
            ...s.messages,
            {
              id,
              chatId,
              authorId: ME_ID,
              text: input.text,
              attachment: input.attachment,
              replyToId: input.replyToId,
              createdAt: Date.now(),
              status: "sending",
              reactions: [],
            },
          ],
        }));
        simulateDelivery(id, chatId);
      },
      editMessage: (id, text) =>
        patch((s) => ({
          ...s,
          messages: s.messages.map((m) => (m.id === id ? { ...m, text, edited: true } : m)),
        })),
      deleteMessage: (id) =>
        patch((s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.id === id
              ? { ...m, deleted: true, text: undefined, attachment: undefined, reactions: [] }
              : m,
          ),
        })),
      toggleReaction: (id, emoji) =>
        patch((s) => ({
          ...s,
          messages: s.messages.map((m) => {
            if (m.id !== id) return m;
            const mine = m.reactions.find((r) => r.userId === ME_ID);
            const rest = m.reactions.filter((r) => r.userId !== ME_ID);
            if (mine?.emoji === emoji) return { ...m, reactions: rest };
            return { ...m, reactions: [...rest, { emoji, userId: ME_ID }] };
          }),
        })),
      toggleStar: (id) =>
        patch((s) => ({
          ...s,
          messages: s.messages.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)),
        })),
      forwardMessage: (id, chatIds) =>
        patch((s) => {
          const source = s.messages.find((m) => m.id === id);
          if (!source) return s;
          const copies: Message[] = chatIds.map((chatId) => ({
            ...source,
            id: uid("m"),
            chatId,
            authorId: ME_ID,
            createdAt: Date.now(),
            status: "sent",
            reactions: [],
            replyToId: undefined,
            forwarded: true,
          }));
          return { ...s, messages: [...s.messages, ...copies] };
        }),
      markChatRead: (chatId) =>
        patch((s) => ({
          ...s,
          chats: s.chats.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c)),
        })),
      setDraft: (chatId, draft) =>
        patch((s) => ({ ...s, chats: s.chats.map((c) => (c.id === chatId ? { ...c, draft } : c)) })),
      patchChat: (chatId, p) =>
        patch((s) => ({ ...s, chats: s.chats.map((c) => (c.id === chatId ? { ...c, ...p } : c)) })),
      createGroup: (name, memberIds, description) => {
        const id = uid("c");
        patch((s) => ({
          ...s,
          chats: [
            {
              id,
              kind: "group",
              name,
              description,
              hue: Math.floor(Math.random() * 360),
              memberIds: [ME_ID, ...memberIds],
              adminIds: [ME_ID],
              unreadCount: 0,
              createdAt: Date.now(),
            },
            ...s.chats,
          ],
          messages: [
            ...s.messages,
            {
              id: uid("m"),
              chatId: id,
              authorId: ME_ID,
              text: `You created the group "${name}"`,
              createdAt: Date.now(),
              status: "read",
              reactions: [],
              system: true,
            },
          ],
        }));
        return id;
      },
      leaveChat: (chatId) =>
        patch((s) => ({
          ...s,
          chats: s.chats.filter((c) => c.id !== chatId),
          messages: s.messages.filter((m) => m.chatId !== chatId),
        })),
      clearChat: (chatId) =>
        patch((s) => ({ ...s, messages: s.messages.filter((m) => m.chatId !== chatId) })),
      addStatus: (text) =>
        patch((s) => {
          const status: StatusUpdate = {
            id: uid("s"),
            userId: ME_ID,
            createdAt: Date.now(),
            kind: "text",
            text,
            hue: 32,
          };
          return { ...s, statuses: [status, ...s.statuses] };
        }),
      viewStatus: (id) =>
        patch((s) => ({
          ...s,
          statuses: s.statuses.map((st) => (st.id === id ? { ...st, viewed: true } : st)),
        })),
      logCall: (userId, kind, durationSec) =>
        patch((s) => ({
          ...s,
          calls: [
            {
              id: uid("k"),
              userId,
              kind,
              direction: "outgoing",
              at: Date.now(),
              durationSec,
            },
            ...s.calls,
          ],
        })),
      toggleBlock: (userId) =>
        patch((s) => ({
          ...s,
          blockedIds: s.blockedIds.includes(userId)
            ? s.blockedIds.filter((b) => b !== userId)
            : [...s.blockedIds, userId],
        })),
      removeDevice: (id) => patch((s) => ({ ...s, devices: s.devices.filter((d) => d.id !== id) })),
      chatTitle,
      chatHue,
      chatPartner,
      lastMessage,
      messagesOf,
      findChatWithUser: (userId) =>
        state.chats.find((c) => c.kind === "dm" && c.memberIds.includes(userId)),
      openDmWith: (userId) => {
        const existing = state.chats.find((c) => c.kind === "dm" && c.memberIds.includes(userId));
        if (existing) return existing.id;
        const id = uid("c");
        patch((s) => ({
          ...s,
          chats: [
            {
              id,
              kind: "dm",
              memberIds: [ME_ID, userId],
              unreadCount: 0,
              createdAt: Date.now(),
            },
            ...s.chats,
          ],
        }));
        return id;
      },
    };
  }, [state, ready, patch, later]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export { ME_ID };
