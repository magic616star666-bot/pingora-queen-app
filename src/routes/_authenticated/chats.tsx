import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Archive,
  BellOff,
  Bell,
  CheckCheck,
  MessageSquarePlus,
  MoreVertical,
  Pin,
  PinOff,
  Search,
  Settings,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { TabScreen, IconButton, EmptyState } from "@/components/pingora/AppShell";
import { ChatRow } from "@/components/pingora/ChatRow";
import { UserAvatar } from "@/components/pingora/UserAvatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import type { Chat } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chats")({
  head: () => ({
    meta: [
      { title: "Chats · Pingora" },
      { name: "description", content: "All your Pingora conversations, pinned, muted and archived." },
      { property: "og:title", content: "Chats · Pingora" },
      { property: "og:description", content: "All your Pingora conversations in one place." },
    ],
  }),
  component: ChatsScreen,
});

const filters = ["All", "Unread", "Groups", "Archived"] as const;

function ChatsScreen() {
  const store = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [sheetChat, setSheetChat] = useState<Chat | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);

  const { chats, messages, users, chatTitle, chatHue, chatPartner, lastMessage, patchChat } = store;

  const archivedCount = chats.filter((c) => c.archived).length;

  const visible = useMemo(() => {
    let list = chats.filter((c) => !c.communityId);
    if (filter === "Archived") list = list.filter((c) => c.archived);
    else list = list.filter((c) => !c.archived);
    if (filter === "Unread") list = list.filter((c) => c.unreadCount > 0);
    if (filter === "Groups") list = list.filter((c) => c.kind === "group");

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        if (chatTitle(c).toLowerCase().includes(q)) return true;
        return messages.some((m) => m.chatId === c.id && m.text?.toLowerCase().includes(q));
      });
    }

    return list.sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      return (lastMessage(b.id)?.createdAt ?? 0) - (lastMessage(a.id)?.createdAt ?? 0);
    });
  }, [chats, filter, query, messages, chatTitle, lastMessage]);

  const matchedMessages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return messages
      .filter((m) => m.text?.toLowerCase().includes(q) && !m.deleted)
      .slice(-12)
      .reverse();
  }, [query, messages]);

  return (
    <TabScreen
      title={
        <span className="flex items-center gap-2">
          <span className="aurora-text">Pingora</span>
        </span>
      }
      actions={
        <>
          <IconButton label="Search chats" onClick={() => setSearching((v) => !v)}>
            {searching ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </IconButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton label="More options">
                <MoreVertical className="h-5 w-5" />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => void navigate({ to: "/new-group" })}>
                <Users className="mr-2 h-4 w-4" /> New group
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("Archived")}>
                <Archive className="mr-2 h-4 w-4" /> Archived
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void navigate({ to: "/profile" })}>
                <UserPlus className="mr-2 h-4 w-4" /> My profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void navigate({ to: "/settings" })}>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    >
      {searching && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 rounded-full bg-secondary px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats and messages"
              className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
      )}

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {f}
            {f === "Archived" && archivedCount ? ` ${archivedCount}` : ""}
          </button>
        ))}
      </div>

      {filter !== "Archived" && archivedCount > 0 && !query && (
        <button
          type="button"
          onClick={() => setFilter("Archived")}
          className="flex w-full items-center gap-3 border-y border-border/60 px-4 py-3 text-left"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-muted-foreground">
            <Archive className="h-5 w-5" />
          </span>
          <span className="flex-1 text-sm font-medium">Archived</span>
          <span className="text-xs font-semibold text-muted-foreground">{archivedCount}</span>
        </button>
      )}

      {store.loadStatus === "loading" && store.chats.length === 0 && (
        <ul className="px-4 py-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 py-3">
              <span className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-secondary" />
              <span className="flex-1 space-y-2">
                <span className="block h-3.5 w-1/3 animate-pulse rounded-full bg-secondary" />
                <span className="block h-3 w-2/3 animate-pulse rounded-full bg-secondary" />
              </span>
            </li>
          ))}
        </ul>
      )}

      {store.loadStatus === "error" && (
        <div className="mx-4 mt-6 rounded-3xl border border-border bg-card p-6 text-center">
          <p className="text-sm font-semibold">We couldn't load your chats</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {store.loadError ?? "Check your connection and try again."}
          </p>
          <button
            type="button"
            onClick={() => void store.reload()}
            className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
        </div>
      )}

      <ul>
        {visible.map((c) => {
          const last = lastMessage(c.id);
          const partner = chatPartner(c);
          return (
            <li key={c.id}>
              <ChatRow
                chat={c}
                title={chatTitle(c)}
                hue={chatHue(c)}
                online={partner?.online}
                last={last}
                authorName={last ? users[last.authorId]?.name : undefined}
                onLongPress={setSheetChat}
              />
            </li>
          );
        })}
      </ul>



      {matchedMessages.length > 0 && (
        <section className="mt-2 border-t border-border/60 pt-2">
          <h2 className="px-4 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Messages
          </h2>
          <ul>
            {matchedMessages.map((m) => {
              const chat = chats.find((c) => c.id === m.chatId);
              if (!chat) return null;
              return (
                <li key={m.id}>
                  <Link
                    to="/chat/$chatId"
                    params={{ chatId: chat.id }}
                    className="flex items-center gap-3 px-4 py-2.5 active:bg-secondary/70"
                  >
                    <UserAvatar
                      name={chatTitle(chat)}
                      hue={chatHue(chat)}
                      size="sm"
                      square={chat.kind === "group"}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{chatTitle(chat)}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {m.authorId === store.meId ? "You: " : ""}
                        {m.text}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {visible.length === 0 && matchedMessages.length === 0 && (
        <EmptyState
          icon={<MessageSquarePlus className="h-7 w-7" />}
          title={query ? "Nothing found" : "No chats here yet"}
          body={
            query
              ? "Try a different name or keyword."
              : "Start a conversation and it will show up right here."
          }
        />
      )}

      <button
        type="button"
        aria-label="New chat"
        onClick={() => setNewChatOpen(true)}
        className="fixed right-5 bottom-24 z-30 grid h-14 w-14 place-items-center rounded-3xl aurora-bg text-primary-foreground shadow-float active:scale-95 md:right-[max(1.25rem,calc(50%-14rem))]"
      >
        <MessageSquarePlus className="h-6 w-6" />
      </button>

      {/* Chat long-press options */}
      <Sheet open={!!sheetChat} onOpenChange={(v) => !v && setSheetChat(null)}>
        <SheetContent side="bottom" className="rounded-t-4xl border-border pb-8">
          <SheetHeader className="text-left">
            <SheetTitle className="text-base">{sheetChat ? chatTitle(sheetChat) : ""}</SheetTitle>
          </SheetHeader>
          <ul className="px-2">
            {sheetChat &&
              [
                {
                  label: sheetChat.pinned ? "Unpin chat" : "Pin chat",
                  icon: sheetChat.pinned ? PinOff : Pin,
                  run: () => patchChat(sheetChat.id, { pinned: !sheetChat.pinned }),
                },
                {
                  label: sheetChat.muted ? "Unmute" : "Mute notifications",
                  icon: sheetChat.muted ? Bell : BellOff,
                  run: () => patchChat(sheetChat.id, { muted: !sheetChat.muted }),
                },
                {
                  label: sheetChat.archived ? "Unarchive" : "Archive chat",
                  icon: Archive,
                  run: () => patchChat(sheetChat.id, { archived: !sheetChat.archived }),
                },
                {
                  label: "Mark as read",
                  icon: CheckCheck,
                  run: () => patchChat(sheetChat.id, { unreadCount: 0 }),
                },
                {
                  label: "Clear messages",
                  icon: Trash2,
                  danger: true,
                  run: () => {
                    store.clearChat(sheetChat.id);
                    toast.success("Messages cleared");
                  },
                },
              ].map((a) => (
                <li key={a.label}>
                  <button
                    type="button"
                    onClick={() => {
                      a.run();
                      setSheetChat(null);
                    }}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left text-[15px] hover:bg-secondary",
                      "danger" in a && a.danger && "text-destructive",
                    )}
                  >
                    <a.icon className="h-5 w-5" /> {a.label}
                  </button>
                </li>
              ))}
          </ul>
        </SheetContent>
      </Sheet>

      {/* New chat contact picker */}
      <Sheet open={newChatOpen} onOpenChange={setNewChatOpen}>
        <SheetContent side="bottom" className="flex h-[82vh] flex-col rounded-t-4xl border-border">
          <SheetHeader className="text-left">
            <SheetTitle className="text-base">New chat</SheetTitle>
          </SheetHeader>
          <button
            type="button"
            onClick={() => {
              setNewChatOpen(false);
              void navigate({ to: "/new-group" });
            }}
            className="mx-2 flex items-center gap-3 rounded-2xl px-2 py-3 text-left hover:bg-secondary"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl aurora-bg text-primary-foreground">
              <Users className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">New group</span>
          </button>
          <ul className="-mx-2 flex-1 overflow-y-auto px-2">
            {store.contacts.length === 0 && (
              <li className="px-2 py-8 text-center text-sm text-muted-foreground">
                No one else has joined yet. Invite a friend to create a Pingora account and they'll
                appear here.
              </li>
            )}
            {store.contacts.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => {
                    void (async () => {
                      try {
                        const id = await store.openDmWith(u.id);
                        setNewChatOpen(false);
                        void navigate({ to: "/chat/$chatId", params: { chatId: id } });
                      } catch {
                        /* error surfaced by the store */
                      }
                    })();
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-secondary"
                >
                  <UserAvatar name={u.name} hue={u.hue} size="sm" online={u.online} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{u.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{u.about}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </TabScreen>
  );
}
