import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  BellOff,
  Bell,
  Info,
  MoreVertical,
  Phone,
  Search,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { StackScreen, IconButton } from "@/components/pingora/AppShell";
import { UserAvatar } from "@/components/pingora/UserAvatar";
import { MessageBubble } from "@/components/pingora/MessageBubble";
import { MessageActionsSheet } from "@/components/pingora/MessageActionsSheet";
import { ForwardSheet } from "@/components/pingora/ForwardSheet";
import { Composer } from "@/components/pingora/Composer";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/lib/store";
import { dayLabel, lastSeenLabel } from "@/lib/format";
import type { Message } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/chat/$chatId")({
  head: () => ({
    meta: [
      { title: "Conversation · Pingora" },
      { name: "description", content: "Read and reply to your Pingora conversation." },
      { property: "og:title", content: "Conversation · Pingora" },
      { property: "og:description", content: "Read and reply to your Pingora conversation." },
    ],
  }),
  component: ChatScreen,
});

function ChatScreen() {
  const { chatId } = Route.useParams();
  const store = useStore();
  const navigate = useNavigate();
  const {
    chats,
    users,
    settings,
    blockedIds,
    chatTitle,
    chatHue,
    chatPartner,
    messagesOf,
    markChatRead,
    setDraft,
  } = store;

  const chat = chats.find((c) => c.id === chatId);
  const [actionTarget, setActionTarget] = useState<Message | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [forwardId, setForwardId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() => (chat ? messagesOf(chat.id) : []), [chat, messagesOf]);

  useEffect(() => {
    if (chat) markChatRead(chat.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (!chat) {
    return (
      <StackScreen title="Chat unavailable">
        <div className="p-8 text-center text-sm text-muted-foreground">
          This conversation no longer exists.
        </div>
      </StackScreen>
    );
  }

  const partner = chatPartner(chat);
  const blocked = !!partner && blockedIds.includes(partner.id);
  const title = chatTitle(chat);

  const subtitle = chat.typing
    ? "typing…"
    : chat.kind === "group"
      ? chat.memberIds
          .map((id) => (id === store.meId ? "You" : (users[id]?.name.split(" ")[0] ?? "")))
          .join(", ")
      : partner?.online
        ? "online"
        : lastSeenLabel(partner?.lastSeen);

  const filtered = query.trim()
    ? messages.filter((m) => m.text?.toLowerCase().includes(query.trim().toLowerCase()))
    : messages;

  const jumpTo = (id: string) => {
    setHighlight(id);
    document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlight(null), 1200);
  };

  return (
    <StackScreen
      back="/chats"
      contentClassName="flex flex-col chat-canvas"
      hero={
        <Link
          to={chat.kind === "group" ? "/group/$chatId" : "/contact/$chatId"}
          params={{ chatId: chat.id }}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl px-1 py-1"
        >
          <UserAvatar
            name={title}
            hue={chatHue(chat)}
            size="sm"
            online={partner?.online}
            square={chat.kind === "group"}
          />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold">{title}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{subtitle}</span>
          </span>
        </Link>
      }
      actions={
        <>
          <IconButton
            label="Video call"
            onClick={() =>
              partner
                ? void navigate({
                    to: "/call/$userId",
                    params: { userId: partner.id },
                    search: { mode: "video" },
                  })
                : toast("Group calls are coming soon")
            }
          >
            <Video className="h-5 w-5" />
          </IconButton>
          <IconButton
            label="Voice call"
            onClick={() =>
              partner
                ? void navigate({
                    to: "/call/$userId",
                    params: { userId: partner.id },
                    search: { mode: "voice" },
                  })
                : toast("Group calls are coming soon")
            }
          >
            <Phone className="h-5 w-5" />
          </IconButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton label="Chat options">
                <MoreVertical className="h-5 w-5" />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() =>
                  void navigate({
                    to: chat.kind === "group" ? "/group/$chatId" : "/contact/$chatId",
                    params: { chatId: chat.id },
                  })
                }
              >
                <Info className="mr-2 h-4 w-4" /> {chat.kind === "group" ? "Group info" : "Contact info"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchOpen(true)}>
                <Search className="mr-2 h-4 w-4" /> Search in chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => store.patchChat(chat.id, { muted: !chat.muted })}>
                {chat.muted ? <Bell className="mr-2 h-4 w-4" /> : <BellOff className="mr-2 h-4 w-4" />}
                {chat.muted ? "Unmute" : "Mute notifications"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  store.clearChat(chat.id);
                  toast.success("Chat cleared");
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Clear messages
              </DropdownMenuItem>
              {partner && (
                <DropdownMenuItem
                  onClick={() => {
                    store.toggleBlock(partner.id);
                    toast(blocked ? `${partner.name} unblocked` : `${partner.name} blocked`);
                  }}
                >
                  <Ban className="mr-2 h-4 w-4" /> {blocked ? "Unblock" : "Block"} {partner.name.split(" ")[0]}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    >
      {searchOpen && (
        <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in this chat"
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
          <IconButton
            label="Close search"
            onClick={() => {
              setSearchOpen(false);
              setQuery("");
            }}
          >
            <X className="h-4 w-4" />
          </IconButton>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-3">
        {chat.kind === "group" && (
          <p className="mx-auto mb-3 max-w-[85%] rounded-2xl bg-card/85 px-3 py-2 text-center text-[11px] text-muted-foreground shadow-soft">
            Messages in this group are visible to {chat.memberIds.length} members.
          </p>
        )}
        {filtered.map((m, i) => {
          const prev = filtered[i - 1];
          const newDay = !prev || dayLabel(prev.createdAt) !== dayLabel(m.createdAt);
          const showAuthor = !prev || prev.authorId !== m.authorId || newDay;
          const replyTarget = m.replyToId ? messages.find((x) => x.id === m.replyToId) : undefined;
          return (
            <div key={m.id}>
              {newDay && (
                <div className="my-3 flex justify-center">
                  <span className="rounded-full bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-soft">
                    {dayLabel(m.createdAt)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={m}
                author={m.authorId === store.meId ? store.me : users[m.authorId]}
                showAuthor={showAuthor}
                replyTo={replyTarget}
                replyAuthorName={
                  replyTarget
                    ? replyTarget.authorId === store.meId
                      ? "You"
                      : users[replyTarget.authorId]?.name
                    : undefined
                }
                onOpenActions={setActionTarget}
                onQuickReact={(msg) => store.toggleReaction(msg.id, "❤️")}
                onJumpToReply={jumpTo}
                highlighted={highlight === m.id}
              />
            </div>
          );
        })}
        {chat.typing && (
          <div className="mt-2 flex px-3">
            <div className="flex items-center gap-1 rounded-3xl rounded-bl-md bg-bubble-in px-4 py-3 shadow-soft">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/70"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      <Composer
        draft={chat.draft ?? ""}
        onDraftChange={(v) => setDraft(chat.id, v)}
        enterToSend={settings.enterToSend}
        replyTo={replyTo ?? undefined}
        replyAuthorName={
          replyTo ? (replyTo.authorId === store.meId ? "You" : users[replyTo.authorId]?.name) : undefined
        }
        onCancelReply={() => setReplyTo(null)}
        editing={editing ?? undefined}
        onCancelEdit={() => setEditing(null)}
        onSaveEdit={(text) => {
          if (editing) store.editMessage(editing.id, text);
          setEditing(null);
          setDraft(chat.id, "");
        }}
        disabled={blocked}
        disabledReason={`You blocked ${partner?.name ?? "this contact"}. Unblock to send messages.`}
        onSend={(input) => {
          store.sendMessage(chat.id, { ...input, replyToId: replyTo?.id });
          setReplyTo(null);
          setDraft(chat.id, "");
        }}
      />

      <MessageActionsSheet
        message={actionTarget}
        onOpenChange={(v) => !v && setActionTarget(null)}
        onReact={(emoji) => actionTarget && store.toggleReaction(actionTarget.id, emoji)}
        onReply={() => setReplyTo(actionTarget)}
        onEdit={() => setEditing(actionTarget)}
        onStar={() => {
          if (!actionTarget) return;
          store.toggleStar(actionTarget.id);
          toast.success(actionTarget.starred ? "Removed from starred" : "Added to starred");
        }}
        onDelete={() => {
          if (!actionTarget) return;
          store.deleteMessage(actionTarget.id);
          toast("Message deleted");
        }}
        onForward={() => setForwardId(actionTarget?.id ?? null)}
      />

      <ForwardSheet
        open={!!forwardId}
        onOpenChange={(v) => !v && setForwardId(null)}
        onConfirm={(ids) => {
          if (forwardId) store.forwardMessage(forwardId, ids);
          toast.success(`Forwarded to ${ids.length} chat${ids.length > 1 ? "s" : ""}`);
          setForwardId(null);
        }}
      />
    </StackScreen>
  );
}
