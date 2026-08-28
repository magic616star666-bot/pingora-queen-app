import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Ban, BellOff, Bell, Phone, Star, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { StackScreen } from "@/components/pingora/AppShell";
import { UserAvatar } from "@/components/pingora/UserAvatar";
import { useStore } from "@/lib/store";
import { lastSeenLabel } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/contact/$chatId")({
  head: () => ({
    meta: [
      { title: "Contact info · Pingora" },
      { name: "description", content: "Contact details, shared media and privacy controls." },
      { property: "og:title", content: "Contact info · Pingora" },
      { property: "og:description", content: "Contact details, shared media and privacy controls." },
    ],
  }),
  component: ContactInfo,
});

function ContactInfo() {
  const { chatId } = Route.useParams();
  const store = useStore();
  const navigate = useNavigate();
  const chat = store.chats.find((c) => c.id === chatId);
  const user = chat ? store.chatPartner(chat) : undefined;

  if (!chat || !user) return <StackScreen title="Contact">Not found</StackScreen>;

  const blocked = store.blockedIds.includes(user.id);
  const starred = store.messagesOf(chat.id).filter((m) => m.starred);

  return (
    <StackScreen back="/chats" title="Contact info">
      <div className="flex flex-col items-center gap-2 px-6 py-6 text-center">
        <UserAvatar name={user.name} hue={user.hue} size="xl" online={user.online} />
        <h1 className="mt-2 text-2xl font-bold">{user.name}</h1>
        <p className="text-sm text-muted-foreground">{user.phone}</p>
        <p className="text-xs text-muted-foreground">
          {user.online ? "online" : lastSeenLabel(user.lastSeen)}
        </p>
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
          onClick={() => void navigate({ to: "/call/$userId", params: { userId: user.id }, search: { mode: "voice" } })}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-secondary py-2.5 text-sm font-medium"
        >
          <Phone className="h-4 w-4" /> Voice
        </button>
        <button
          type="button"
          onClick={() => void navigate({ to: "/call/$userId", params: { userId: user.id }, search: { mode: "video" } })}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-secondary py-2.5 text-sm font-medium"
        >
          <Video className="h-4 w-4" /> Video
        </button>
      </div>

      <section className="mt-6 rounded-3xl border border-border bg-card mx-4 p-4">
        <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">About</h2>
        <p className="mt-1 text-sm">{user.about}</p>
      </section>

      <section className="mt-4 mx-4 rounded-3xl border border-border bg-card p-4">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          <Star className="h-3.5 w-3.5" /> Starred messages
        </h2>
        {starred.length ? (
          <ul className="mt-2 space-y-1">
            {starred.map((m) => (
              <li key={m.id} className="truncate text-sm text-muted-foreground">
                {m.text ?? m.attachment?.kind}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">No starred messages yet.</p>
        )}
      </section>

      <ul className="mt-5 border-t border-border/60 pt-2 pb-10">
        <li>
          <button
            type="button"
            onClick={() => store.patchChat(chat.id, { muted: !chat.muted })}
            className="flex w-full items-center gap-4 px-4 py-3 text-left text-[15px] hover:bg-secondary"
          >
            {chat.muted ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            {chat.muted ? "Unmute notifications" : "Mute notifications"}
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              store.clearChat(chat.id);
              toast.success("Chat cleared");
            }}
            className="flex w-full items-center gap-4 px-4 py-3 text-left text-[15px] hover:bg-secondary"
          >
            <Trash2 className="h-5 w-5" /> Clear chat
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              store.toggleBlock(user.id);
              toast(blocked ? "Contact unblocked" : "Contact blocked");
            }}
            className="flex w-full items-center gap-4 px-4 py-3 text-left text-[15px] text-destructive hover:bg-secondary"
          >
            <Ban className="h-5 w-5" /> {blocked ? "Unblock" : "Block"} {user.name.split(" ")[0]}
          </button>
        </li>
      </ul>
    </StackScreen>
  );
}
