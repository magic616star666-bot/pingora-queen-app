import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BellOff, Bell, LogOut, Pin, PinOff, Search, Shield, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { StackScreen } from "@/components/pingora/AppShell";
import { UserAvatar } from "@/components/pingora/UserAvatar";
import { useStore } from "@/lib/store";
import { lastSeenLabel } from "@/lib/format";

export const Route = createFileRoute("/group/$chatId")({
  head: () => ({
    meta: [
      { title: "Group info · Pingora" },
      { name: "description", content: "Members, media and settings for this Pingora group." },
      { property: "og:title", content: "Group info · Pingora" },
      { property: "og:description", content: "Members, media and settings for this Pingora group." },
    ],
  }),
  component: GroupInfo,
});

function GroupInfo() {
  const { chatId } = Route.useParams();
  const store = useStore();
  const navigate = useNavigate();
  const chat = store.chats.find((c) => c.id === chatId);

  if (!chat) return <StackScreen title="Group">Not found</StackScreen>;

  const media = store.messagesOf(chat.id).filter((m) => m.attachment);

  return (
    <StackScreen back="/chats" title="Group info">
      <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
        <UserAvatar name={chat.name ?? "Group"} hue={store.chatHue(chat)} size="xl" square />
        <h1 className="text-2xl font-bold">{chat.name}</h1>
        <p className="text-xs text-muted-foreground">
          Group · {chat.memberIds.length} members
        </p>
        {chat.description && <p className="text-sm text-muted-foreground">{chat.description}</p>}
      </div>

      <div className="mx-4 flex gap-2">
        <Link
          to="/chat/$chatId"
          params={{ chatId: chat.id }}
          className="flex-1 rounded-2xl bg-secondary py-2.5 text-center text-sm font-medium"
        >
          Message
        </Link>
        <button
          type="button"
          onClick={() => store.patchChat(chat.id, { muted: !chat.muted })}
          className="flex-1 rounded-2xl bg-secondary py-2.5 text-center text-sm font-medium"
        >
          {chat.muted ? "Unmute" : "Mute"}
        </button>
        <button
          type="button"
          onClick={() => store.patchChat(chat.id, { pinned: !chat.pinned })}
          className="flex-1 rounded-2xl bg-secondary py-2.5 text-center text-sm font-medium"
        >
          {chat.pinned ? "Unpin" : "Pin"}
        </button>
      </div>

      <section className="mt-6 px-4">
        <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Media, links and docs
        </h2>
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {media.length ? (
            media.map((m) => (
              <div
                key={m.id}
                className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl text-[10px] font-medium text-primary-foreground"
                style={{
                  background: `linear-gradient(140deg, oklch(0.7 0.14 ${(m.id.length * 37) % 360}), oklch(0.55 0.13 205))`,
                }}
              >
                {m.attachment?.kind}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nothing shared yet.</p>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="px-4 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {chat.memberIds.length} members
        </h2>
        <ul className="mt-1">
          {chat.memberIds.map((id) => {
            const u = id === store.meId ? store.me : store.users[id];
            if (!u) return null;
            const admin = chat.adminIds?.includes(id);
            return (
              <li key={id} className="flex items-center gap-3 px-4 py-2.5">
                <UserAvatar name={u.name} hue={u.hue} size="sm" online={u.online} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {id === store.meId ? "You" : u.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {u.online ? "online" : lastSeenLabel(u.lastSeen)}
                  </span>
                </span>
                {admin && (
                  <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                    Admin
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <ul className="mt-4 border-t border-border/60 pt-2 pb-10">
        {[
          { label: "Add members", icon: UserPlus, run: () => toast("Member invites coming soon") },
          { label: "Search in group", icon: Search, run: () => void navigate({ to: "/chat/$chatId", params: { chatId: chat.id } }) },
          { label: chat.muted ? "Unmute group" : "Mute group", icon: chat.muted ? Bell : BellOff, run: () => store.patchChat(chat.id, { muted: !chat.muted }) },
          { label: chat.pinned ? "Unpin group" : "Pin group", icon: chat.pinned ? PinOff : Pin, run: () => store.patchChat(chat.id, { pinned: !chat.pinned }) },
          { label: "Group permissions", icon: Shield, run: () => toast("Only admins can change this") },
          {
            label: "Clear messages",
            icon: Trash2,
            run: () => {
              store.clearChat(chat.id);
              toast.success("Messages cleared");
            },
          },
          {
            label: "Exit group",
            icon: LogOut,
            danger: true,
            run: () => {
              store.leaveChat(chat.id);
              toast("You left the group");
              void navigate({ to: "/chats" });
            },
          },
        ].map((a) => (
          <li key={a.label}>
            <button
              type="button"
              onClick={a.run}
              className={`flex w-full items-center gap-4 px-4 py-3 text-left text-[15px] hover:bg-secondary ${"danger" in a && a.danger ? "text-destructive" : ""}`}
            >
              <a.icon className="h-5 w-5" /> {a.label}
            </button>
          </li>
        ))}
      </ul>
    </StackScreen>
  );
}
