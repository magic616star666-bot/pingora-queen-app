import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Phone, PhoneIncoming, PhoneOutgoing, Video, Link2 } from "lucide-react";
import { toast } from "sonner";
import { TabScreen, IconButton, EmptyState } from "@/components/pingora/AppShell";
import { UserAvatar } from "@/components/pingora/UserAvatar";
import { useStore } from "@/lib/store";
import { duration, listTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calls")({
  head: () => ({
    meta: [
      { title: "Calls · Pingora" },
      { name: "description", content: "Your Pingora voice and video call history." },
      { property: "og:title", content: "Calls · Pingora" },
      { property: "og:description", content: "Voice and video calls with the people you talk to most." },
    ],
  }),
  component: CallsScreen,
});

function CallsScreen() {
  const { calls, users } = useStore();
  const navigate = useNavigate();

  return (
    <TabScreen
      title="Calls"
      actions={
        <IconButton label="Create call link" onClick={() => toast.success("Call link copied")}>
          <Link2 className="h-5 w-5" />
        </IconButton>
      }
    >
      <button
        type="button"
        onClick={() => toast.success("Call link copied to clipboard")}
        className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-secondary/70"
      >
        <span className="grid h-11 w-11 place-items-center rounded-2xl aurora-bg text-primary-foreground">
          <Link2 className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-[15px] font-semibold">Create call link</span>
          <span className="block text-xs text-muted-foreground">Share a link for a Pingora call</span>
        </span>
      </button>

      <h2 className="border-t border-border/60 px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        Recent
      </h2>
      <ul>
        {calls.map((k) => {
          const u = users[k.userId];
          if (!u) return null;
          const Icon = k.direction === "incoming" ? PhoneIncoming : PhoneOutgoing;
          return (
            <li key={k.id} className="flex items-center gap-3 px-4 py-2.5">
              <UserAvatar name={u.name} hue={u.hue} size="md" />
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-[15px] font-semibold", k.missed && "text-destructive")}>
                  {u.name}
                </p>
                <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  {k.missed ? "Missed" : listTime(k.at)}
                  {k.durationSec ? ` · ${duration(k.durationSec)}` : ""}
                </p>
              </div>
              <IconButton
                label={`Call ${u.name}`}
                className="text-primary"
                onClick={() =>
                  void navigate({
                    to: "/call/$userId",
                    params: { userId: u.id },
                    search: { mode: k.kind },
                  })
                }
              >
                {k.kind === "video" ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
              </IconButton>
            </li>
          );
        })}
      </ul>

      {!calls.length && (
        <EmptyState
          icon={<Phone className="h-7 w-7" />}
          title="No calls yet"
          body="Start a voice or video call from any chat."
        />
      )}
    </TabScreen>
  );
}
