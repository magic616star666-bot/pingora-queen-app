import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CircleDashed, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { TabScreen, IconButton } from "@/components/pingora/AppShell";
import { UserAvatar } from "@/components/pingora/UserAvatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ME_ID, useStore } from "@/lib/store";
import { agoLabel } from "@/lib/format";
import type { StatusUpdate } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/updates")({
  head: () => ({
    meta: [
      { title: "Updates · Pingora" },
      { name: "description", content: "24-hour status updates from your Pingora contacts." },
      { property: "og:title", content: "Updates · Pingora" },
      { property: "og:description", content: "Share a moment that disappears in 24 hours." },
    ],
  }),
  component: UpdatesScreen,
});

function UpdatesScreen() {
  const { statuses, users, me, addStatus, viewStatus } = useStore();
  const [composeOpen, setComposeOpen] = useState(false);
  const [text, setText] = useState("");
  const [viewing, setViewing] = useState<StatusUpdate | null>(null);

  const mine = statuses.filter((s) => s.userId === ME_ID);
  const recent = statuses.filter((s) => s.userId !== ME_ID && !s.viewed);
  const viewed = statuses.filter((s) => s.userId !== ME_ID && s.viewed);

  const Row = ({ s }: { s: StatusUpdate }) => {
    const u = s.userId === ME_ID ? me : users[s.userId];
    return (
      <button
        type="button"
        onClick={() => {
          viewStatus(s.id);
          setViewing(s);
        }}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-secondary/70"
      >
        <UserAvatar
          name={u?.name ?? "Unknown"}
          hue={s.hue ?? u?.hue}
          size="md"
          ring={s.viewed ? "seen" : "unseen"}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">{u?.name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {agoLabel(s.createdAt)} · {s.kind === "text" ? "Text update" : "Photo update"}
          </span>
        </span>
      </button>
    );
  };

  return (
    <TabScreen title="Updates" subtitle="Disappears after 24 hours">
      <section className="pt-1">
        <h2 className="px-4 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          My status
        </h2>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="relative">
            <UserAvatar name={me.name} hue={me.hue} size="md" ring={mine.length ? "unseen" : "none"} />
            <span className="absolute -right-1 -bottom-1 grid h-6 w-6 place-items-center rounded-full aurora-bg text-primary-foreground">
              <Plus className="h-3.5 w-3.5" />
            </span>
          </div>
          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            className="min-w-0 flex-1 text-left"
          >
            <span className="block text-[15px] font-semibold">My status</span>
            <span className="block truncate text-xs text-muted-foreground">
              {mine.length
                ? `${mine.length} update${mine.length > 1 ? "s" : ""} · ${agoLabel(mine[0]!.createdAt)}`
                : "Tap to add a status update"}
            </span>
          </button>
          <IconButton label="Write update" onClick={() => setComposeOpen(true)}>
            <Pencil className="h-4 w-4" />
          </IconButton>
        </div>
      </section>

      {recent.length > 0 && (
        <section className="mt-2 border-t border-border/60 pt-2">
          <h2 className="px-4 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Recent
          </h2>
          {recent.map((s) => (
            <Row key={s.id} s={s} />
          ))}
        </section>
      )}

      {viewed.length > 0 && (
        <section className="mt-2 border-t border-border/60 pt-2">
          <h2 className="px-4 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Viewed
          </h2>
          {viewed.map((s) => (
            <Row key={s.id} s={s} />
          ))}
        </section>
      )}

      {!statuses.length && (
        <div className="px-10 py-16 text-center">
          <CircleDashed className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No updates yet today.</p>
        </div>
      )}

      <Sheet open={composeOpen} onOpenChange={setComposeOpen}>
        <SheetContent side="bottom" className="rounded-t-4xl border-border pb-8">
          <SheetHeader className="text-left">
            <SheetTitle className="text-base">New text update</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 px-4">
            <Textarea
              autoFocus
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's happening?"
              className="rounded-2xl text-base"
            />
            <Button
              className="w-full rounded-full"
              disabled={!text.trim()}
              onClick={() => {
                addStatus(text.trim());
                setText("");
                setComposeOpen(false);
                toast.success("Status shared for 24 hours");
              }}
            >
              Share update
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-4xl border-border p-0">
          {viewing && (
            <div
              className="flex h-full flex-col items-center justify-center gap-4 rounded-t-4xl px-8 text-center"
              style={{
                background: `linear-gradient(160deg, oklch(0.68 0.16 ${viewing.hue ?? 32}), oklch(0.45 0.14 ${((viewing.hue ?? 32) + 60) % 360}))`,
              }}
            >
              <div className="absolute top-4 right-0 left-0 mx-6 h-1 overflow-hidden rounded-full bg-primary-foreground/30">
                <div className="h-full w-2/3 rounded-full bg-primary-foreground" />
              </div>
              <UserAvatar
                name={(viewing.userId === ME_ID ? me : users[viewing.userId])?.name ?? "?"}
                hue={viewing.hue}
                size="lg"
              />
              <p className="font-display text-2xl font-bold text-primary-foreground">
                {viewing.text ?? "Photo update"}
              </p>
              <p className="text-xs text-primary-foreground/80">{agoLabel(viewing.createdAt)}</p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </TabScreen>
  );
}
