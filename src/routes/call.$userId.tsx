import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff, Volume2, Users, MessageCircle } from "lucide-react";
import { z } from "zod";
import { UserAvatar } from "@/components/pingora/UserAvatar";
import { useStore } from "@/lib/store";
import { duration } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/call/$userId")({
  validateSearch: z.object({ mode: z.enum(["voice", "video"]).default("voice") }),
  head: () => ({
    meta: [
      { title: "Call · Pingora" },
      { name: "description", content: "Ongoing Pingora voice or video call." },
      { property: "og:title", content: "Call · Pingora" },
      { property: "og:description", content: "Ongoing Pingora voice or video call." },
    ],
  }),
  component: CallScreen,
});

function CallScreen() {
  const { userId } = Route.useParams();
  const { mode } = Route.useSearch();
  const { users, logCall } = useStore();
  const navigate = useNavigate();
  const user = users[userId];
  const [phase, setPhase] = useState<"ringing" | "active">("ringing");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(mode === "voice");
  const [speaker, setSpeaker] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setPhase("active"), 2200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "active") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const hangUp = () => {
    if (user) logCall(user.id, mode, seconds);
    void navigate({ to: "/calls" });
  };

  const controls = [
    { label: muted ? "Unmute" : "Mute", icon: muted ? MicOff : Mic, on: muted, run: () => setMuted((v) => !v) },
    {
      label: camOff ? "Camera on" : "Camera off",
      icon: camOff ? VideoOff : Video,
      on: camOff,
      run: () => setCamOff((v) => !v),
    },
    { label: "Speaker", icon: Volume2, on: speaker, run: () => setSpeaker((v) => !v) },
    { label: "Add people", icon: Users, on: false, run: () => {} },
    { label: "Chat", icon: MessageCircle, on: false, run: () => void navigate({ to: "/chats" }) },
  ];

  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-between px-6 py-10"
      style={{
        background: `linear-gradient(170deg, oklch(0.32 0.09 ${user?.hue ?? 32}), oklch(0.19 0.03 258) 65%)`,
      }}
    >
      <div className="safe-top flex flex-col items-center gap-4 pt-8 text-center">
        <UserAvatar name={user?.name ?? "Unknown"} hue={user?.hue} size="xl" />
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-foreground">
            {user?.name ?? "Unknown"}
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/75">
            {phase === "ringing"
              ? mode === "video"
                ? "Ringing · video call"
                : "Ringing…"
              : `${mode === "video" ? "Video call" : "Voice call"} · ${duration(seconds || 1)}`}
          </p>
        </div>
        <p className="rounded-full bg-primary-foreground/10 px-3 py-1 text-[11px] text-primary-foreground/75">
          End-to-end encrypted
        </p>
      </div>

      {mode === "video" && !camOff && (
        <div className="h-40 w-28 overflow-hidden rounded-3xl border-2 border-primary-foreground/25">
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(150deg, oklch(0.7 0.14 32), oklch(0.55 0.12 205))`,
            }}
          />
        </div>
      )}

      <div className="safe-bottom w-full">
        <div className="mb-6 flex justify-center gap-3">
          {controls.map((c) => (
            <button
              key={c.label}
              type="button"
              aria-label={c.label}
              onClick={c.run}
              className={cn(
                "grid h-12 w-12 place-items-center rounded-full transition-colors",
                c.on
                  ? "bg-primary-foreground text-foreground"
                  : "bg-primary-foreground/15 text-primary-foreground",
              )}
            >
              <c.icon className="h-5 w-5" />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={hangUp}
          className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-float active:scale-95"
          aria-label="End call"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
