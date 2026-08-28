import { createFileRoute, Link } from "@tanstack/react-router";
import { Hash, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { TabScreen, IconButton } from "@/components/pingora/AppShell";
import { UserAvatar } from "@/components/pingora/UserAvatar";
import { useStore } from "@/lib/store";
import { listTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/communities")({
  head: () => ({
    meta: [
      { title: "Communities · Pingora" },
      { name: "description", content: "Neighbourhoods, teams and interest groups organised into Pingora communities." },
      { property: "og:title", content: "Communities · Pingora" },
      { property: "og:description", content: "Group your people into communities with focused topic chats." },
    ],
  }),
  component: CommunitiesScreen,
});

function CommunitiesScreen() {
  const { communities, chats, lastMessage } = useStore();

  return (
    <TabScreen
      title="Communities"
      actions={
        <IconButton label="New community" onClick={() => toast("Community creation is coming next")}>
          <Plus className="h-5 w-5" />
        </IconButton>
      }
    >
      <ul className="space-y-3 px-4 pt-1">
        {communities.map((c) => (
          <li key={c.id} className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            <div className="flex items-center gap-3 p-4">
              <UserAvatar name={c.name} hue={c.hue} size="md" square />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[15px] font-semibold">{c.name}</h2>
                <p className="truncate text-xs text-muted-foreground">
                  {c.memberCount.toLocaleString()} members
                </p>
              </div>
            </div>
            <p className="px-4 pb-3 text-[13px] text-muted-foreground">{c.description}</p>
            <ul className="border-t border-border/60">
              {c.groupIds.map((gid) => {
                const chat = chats.find((x) => x.id === gid);
                if (!chat) return null;
                const last = lastMessage(chat.id);
                return (
                  <li key={gid}>
                    <Link
                      to="/chat/$chatId"
                      params={{ chatId: chat.id }}
                      className="flex items-center gap-3 px-4 py-3 active:bg-secondary/70"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
                        <Hash className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {chat.name?.split("·").slice(-1)[0]?.trim() ?? chat.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {last?.text ?? "No messages yet"}
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {last ? listTime(last.createdAt) : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
      <p className="flex items-center justify-center gap-2 px-8 py-8 text-center text-xs text-muted-foreground">
        <Users className="h-4 w-4" /> Communities bundle related group chats under one roof.
      </p>
    </TabScreen>
  );
}
