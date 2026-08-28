import { useRef } from "react";
import {
  Check,
  CheckCheck,
  Clock,
  File,
  Forward,
  Image as ImageIcon,
  MapPin,
  Mic,
  Play,
  Star,
  Trash2,
} from "lucide-react";
import type { Message, User } from "@/lib/types";
import { clockTime, duration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

function Ticks({ status }: { status: Message["status"] }) {
  if (status === "sending") return <Clock className="h-3.5 w-3.5 opacity-60" />;
  if (status === "sent") return <Check className="h-3.5 w-3.5 opacity-70" />;
  if (status === "delivered") return <CheckCheck className="h-3.5 w-3.5 opacity-70" />;
  return <CheckCheck className="h-3.5 w-3.5 text-accent" />;
}

function AttachmentBody({ message }: { message: Message }) {
  const a = message.attachment;
  if (!a) return null;

  if (a.kind === "image" || a.kind === "video") {
    return (
      <div className="mb-1 overflow-hidden rounded-2xl">
        <div
          className="relative grid aspect-4/3 w-56 place-items-center"
          style={{
            background: `linear-gradient(150deg, oklch(0.75 0.13 ${a.kind === "image" ? 205 : 32}), oklch(0.6 0.15 ${a.kind === "image" ? 260 : 60}))`,
          }}
        >
          {a.kind === "video" ? (
            <span className="grid h-12 w-12 place-items-center rounded-full bg-background/85">
              <Play className="h-5 w-5 fill-current" />
            </span>
          ) : (
            <ImageIcon className="h-8 w-8 text-primary-foreground/80" />
          )}
          {a.kind === "video" && (
            <span className="absolute bottom-2 left-2 rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-medium">
              0:42
            </span>
          )}
        </div>
      </div>
    );
  }

  if (a.kind === "document") {
    return (
      <div className="mb-1 flex w-56 items-center gap-3 rounded-2xl bg-background/45 p-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <File className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{a.name ?? "Document"}</span>
          <span className="block text-[11px] opacity-70">PDF · {a.size ?? "—"}</span>
        </span>
      </div>
    );
  }

  if (a.kind === "voice") {
    return (
      <div className="mb-1 flex w-56 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/20 text-primary">
          <Mic className="h-4 w-4" />
        </span>
        <span className="flex flex-1 items-center gap-[3px]" aria-hidden="true">
          {Array.from({ length: 26 }).map((_, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-current opacity-55"
              style={{ height: `${6 + Math.abs(Math.sin(i * 1.7)) * 16}px` }}
            />
          ))}
        </span>
        <span className="text-[11px] opacity-70">{duration(a.durationSec ?? 12)}</span>
      </div>
    );
  }

  if (a.kind === "location") {
    return (
      <div className="mb-1 flex w-56 items-center gap-3 rounded-2xl bg-background/45 p-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/20 text-accent">
          <MapPin className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{a.name ?? "Shared location"}</span>
          <span className="block text-[11px] opacity-70">Live for 1 hour</span>
        </span>
      </div>
    );
  }

  return null;
}

export function MessageBubble({
  message,
  author,
  showAuthor,
  replyTo,
  replyAuthorName,
  onOpenActions,
  onQuickReact,
  onJumpToReply,
  highlighted,
}: {
  message: Message;
  author?: User | undefined;
  showAuthor: boolean;
  replyTo?: Message | undefined;
  replyAuthorName?: string | undefined;
  onOpenActions: (m: Message) => void;
  onQuickReact: (m: Message) => void;
  onJumpToReply?: ((id: string) => void) | undefined;
  highlighted?: boolean | undefined;
}) {
  const { meId } = useStore();
  const mine = message.authorId === meId;
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (message.system) {
    return (
      <div className="my-3 flex justify-center">
        <span className="rounded-full bg-card px-3 py-1 text-[11px] text-muted-foreground shadow-soft">
          {message.text}
        </span>
      </div>
    );
  }

  const startPress = () => {
    pressTimer.current = setTimeout(() => onOpenActions(message), 420);
  };
  const endPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  return (
    <div
      id={`msg-${message.id}`}
      className={cn("flex px-3", mine ? "justify-end" : "justify-start", showAuthor ? "mt-2" : "mt-0.5")}
    >
      <div className={cn("max-w-[82%]", highlighted && "animate-pulse")}>
        <div
          role="button"
          tabIndex={0}
          onPointerDown={startPress}
          onPointerUp={endPress}
          onPointerLeave={endPress}
          onClick={() => onOpenActions(message)}
          onDoubleClick={() => onQuickReact(message)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onOpenActions(message);
          }}
          className={cn(
            "relative rounded-3xl px-3 py-2 text-left text-[15px] leading-snug shadow-soft transition-transform active:scale-[0.99]",
            mine
              ? "rounded-br-md bg-bubble-out text-bubble-out-foreground"
              : "rounded-bl-md bg-bubble-in text-bubble-in-foreground",
          )}
        >
          {showAuthor && !mine && author && (
            <p
              className="mb-0.5 text-xs font-semibold"
              style={{ color: `oklch(0.6 0.15 ${author.hue})` }}
            >
              {author.name}
            </p>
          )}

          {message.forwarded && (
            <p className="mb-1 flex items-center gap-1 text-[11px] italic opacity-65">
              <Forward className="h-3 w-3" /> Forwarded
            </p>
          )}

          {replyTo && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onJumpToReply?.(replyTo.id);
              }}
              className="mb-1.5 flex w-full flex-col items-start gap-0.5 rounded-xl border-l-[3px] border-accent bg-background/40 px-2 py-1.5 text-left"
            >
              <span className="text-[11px] font-semibold text-accent">
                {replyAuthorName ?? "You"}
              </span>
              <span className="line-clamp-2 text-xs opacity-75">
                {replyTo.deleted
                  ? "Message deleted"
                  : (replyTo.text ?? replyTo.attachment?.kind ?? "Attachment")}
              </span>
            </button>
          )}

          {message.deleted ? (
            <p className="flex items-center gap-1.5 text-sm italic opacity-60">
              <Trash2 className="h-3.5 w-3.5" /> This message was deleted
            </p>
          ) : (
            <>
              <AttachmentBody message={message} />
              {message.attachment?.caption && (
                <p className="whitespace-pre-wrap">{message.attachment.caption}</p>
              )}
              {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
            </>
          )}

          <div className="mt-1 flex items-center justify-end gap-1 text-[11px] opacity-70">
            {message.starred && <Star className="h-3 w-3 fill-current" />}
            {message.edited && <span className="italic">edited</span>}
            <span>{clockTime(message.createdAt)}</span>
            {mine && !message.deleted && <Ticks status={message.status} />}
          </div>

          {message.reactions.length > 0 && (
            <div
              className={cn(
                "absolute -bottom-3 flex items-center gap-0.5 rounded-full border border-border bg-card px-1.5 py-0.5 shadow-soft",
                mine ? "right-2" : "left-2",
              )}
            >
              {Array.from(new Set(message.reactions.map((r) => r.emoji))).map((e) => (
                <span key={e} className="text-xs">
                  {e}
                </span>
              ))}
              {message.reactions.length > 1 && (
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {message.reactions.length}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
