import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Ban,
  Bell,
  ChevronRight,
  Database,
  LogOut,
  MessageSquare,
  Monitor,
  Moon,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { StackScreen } from "@/components/pingora/AppShell";
import { UserAvatar } from "@/components/pingora/UserAvatar";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";
import { agoLabel } from "@/lib/format";
import type { Settings as SettingsShape } from "@/lib/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Pingora" },
      {
        name: "description",
        content:
          "Privacy, notifications, chats, storage, linked devices and blocked contacts for your Pingora account.",
      },
      { property: "og:title", content: "Settings · Pingora" },
      { property: "og:description", content: "Control privacy, notifications, storage and devices." },
    ],
  }),
  component: SettingsScreen,
});

function Row({
  label,
  hint,
  control,
}: {
  label: string;
  hint?: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function Choice<K extends keyof SettingsShape>({
  value,
  options,
  onPick,
}: {
  value: SettingsShape[K];
  options: readonly string[];
  onPick: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-full bg-secondary p-1">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onPick(o)}
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${
            value === o ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function SettingsScreen() {
  const store = useStore();
  const navigate = useNavigate();
  const { me, settings, updateSettings, devices, blockedIds, users } = store;

  return (
    <StackScreen back="/chats" title="Settings">
      <Link
        to="/profile"
        className="mx-4 mt-3 flex items-center gap-3 rounded-3xl border border-border bg-card p-4"
      >
        <UserAvatar name={me.name} hue={me.hue} size="md" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">{me.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{me.about}</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </Link>

      <div className="mx-4 mt-3 flex items-center justify-between rounded-3xl border border-border bg-card px-4 py-3">
        <span className="flex items-center gap-3 text-sm font-medium">
          <Moon className="h-5 w-5" /> Dark mode
        </span>
        <Switch
          checked={settings.theme === "dark"}
          onCheckedChange={(v) => updateSettings({ theme: v ? "dark" : "light" })}
        />
      </div>

      <Accordion type="multiple" className="mx-4 mt-3 mb-10 space-y-2">
        <AccordionItem value="privacy" className="rounded-3xl border border-border bg-card px-4">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5" /> Privacy
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <Row
              label="Read receipts"
              hint="Others see when you've read messages"
              control={
                <Switch
                  checked={settings.readReceipts}
                  onCheckedChange={(v) => updateSettings({ readReceipts: v })}
                />
              }
            />
            <Row
              label="Last seen"
              control={
                <Choice
                  value={settings.lastSeenVisibility}
                  options={["everyone", "contacts", "nobody"] as const}
                  onPick={(v) =>
                    updateSettings({ lastSeenVisibility: v as SettingsShape["lastSeenVisibility"] })
                  }
                />
              }
            />
            <Row
              label="Profile photo"
              control={
                <Choice
                  value={settings.profilePhotoVisibility}
                  options={["everyone", "contacts", "nobody"] as const}
                  onPick={(v) =>
                    updateSettings({
                      profilePhotoVisibility: v as SettingsShape["profilePhotoVisibility"],
                    })
                  }
                />
              }
            />
            <Row
              label="About"
              control={
                <Choice
                  value={settings.aboutVisibility}
                  options={["everyone", "contacts", "nobody"] as const}
                  onPick={(v) =>
                    updateSettings({ aboutVisibility: v as SettingsShape["aboutVisibility"] })
                  }
                />
              }
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="notifications" className="rounded-3xl border border-border bg-card px-4">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-3">
              <Bell className="h-5 w-5" /> Notifications
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <Row
              label="Message notifications"
              control={
                <Switch
                  checked={settings.messageNotifications}
                  onCheckedChange={(v) => updateSettings({ messageNotifications: v })}
                />
              }
            />
            <Row
              label="Group notifications"
              control={
                <Switch
                  checked={settings.groupNotifications}
                  onCheckedChange={(v) => updateSettings({ groupNotifications: v })}
                />
              }
            />
            <Row
              label="Reaction notifications"
              control={
                <Switch
                  checked={settings.reactionNotifications}
                  onCheckedChange={(v) => updateSettings({ reactionNotifications: v })}
                />
              }
            />
            <Row
              label="Call ringtone"
              control={
                <Switch
                  checked={settings.callRingtone}
                  onCheckedChange={(v) => updateSettings({ callRingtone: v })}
                />
              }
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="chats" className="rounded-3xl border border-border bg-card px-4">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5" /> Chats
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <Row
              label="Enter key sends"
              control={
                <Switch
                  checked={settings.enterToSend}
                  onCheckedChange={(v) => updateSettings({ enterToSend: v })}
                />
              }
            />
            <Row
              label="Keep chats archived"
              control={
                <Switch
                  checked={settings.archiveKeepMuted}
                  onCheckedChange={(v) => updateSettings({ archiveKeepMuted: v })}
                />
              }
            />
            <Row
              label="Font size"
              control={
                <Choice
                  value={settings.fontSize}
                  options={["small", "medium", "large"] as const}
                  onPick={(v) => updateSettings({ fontSize: v as SettingsShape["fontSize"] })}
                />
              }
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="storage" className="rounded-3xl border border-border bg-card px-4">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-3">
              <Database className="h-5 w-5" /> Storage and data
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="py-2">
              <p className="text-sm font-medium">1.8 GB of 8 GB used</p>
              <Progress value={23} className="mt-2" />
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                <li>Photos · 940 MB</li>
                <li>Videos · 620 MB</li>
                <li>Voice notes · 180 MB</li>
                <li>Documents · 60 MB</li>
              </ul>
            </div>
            <Row
              label="Media auto-download"
              control={
                <Choice
                  value={settings.mediaAutoDownload}
                  options={["never", "wifi", "always"] as const}
                  onPick={(v) =>
                    updateSettings({ mediaAutoDownload: v as SettingsShape["mediaAutoDownload"] })
                  }
                />
              }
            />
            <Row
              label="Use less data for calls"
              control={
                <Switch
                  checked={settings.dataSaverCalls}
                  onCheckedChange={(v) => updateSettings({ dataSaverCalls: v })}
                />
              }
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="devices" className="rounded-3xl border border-border bg-card px-4">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-3">
              <Monitor className="h-5 w-5" /> Linked devices
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul>
              {devices.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-muted-foreground">
                    <Smartphone className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{d.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {d.platform} · active {agoLabel(d.lastActive)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      store.removeDevice(d.id);
                      toast("Device signed out");
                    }}
                    className="shrink-0 text-xs font-semibold text-destructive"
                  >
                    Log out
                  </button>
                </li>
              ))}
              {!devices.length && <li className="py-2 text-sm text-muted-foreground">No linked devices.</li>}
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="blocked" className="rounded-3xl border border-border bg-card px-4">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-3">
              <Ban className="h-5 w-5" /> Blocked contacts ({blockedIds.length})
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul>
              {blockedIds.map((id) => {
                const u = users[id];
                if (!u) return null;
                return (
                  <li key={id} className="flex items-center gap-3 py-2.5">
                    <UserAvatar name={u.name} hue={u.hue} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{u.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        store.toggleBlock(id);
                        toast.success("Contact unblocked");
                      }}
                      className="shrink-0 text-xs font-semibold text-primary"
                    >
                      Unblock
                    </button>
                  </li>
                );
              })}
              {!blockedIds.length && (
                <li className="py-2 text-sm text-muted-foreground">Nobody is blocked.</li>
              )}
            </ul>
          </AccordionContent>
        </AccordionItem>

        <button
          type="button"
          onClick={() => {
            store.signOut();
            toast("Signed out of Pingora");
            void navigate({ to: "/" });
          }}
          className="flex w-full items-center gap-3 rounded-3xl border border-border bg-card px-4 py-3.5 text-sm font-semibold text-destructive"
        >
          <LogOut className="h-5 w-5" /> Log out
        </button>
      </Accordion>
    </StackScreen>
  );
}
