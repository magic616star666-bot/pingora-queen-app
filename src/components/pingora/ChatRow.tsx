import { Link } from "@tanstack/react-router";
import {
  BellOff,
  Check,
  CheckCheck,
  File,
  Image as ImageIcon,
  MapPin,
  Mic,
  Pin,
  Users,
  Video,
} from "lucide-react";
import type { Chat, Message } from "@/lib/types";
import { listTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ME_ID } from "@/lib/store";
import { UserAvatar } from "./UserAvatar";

const attachmentIcon = {
  image: ImageIcon,
  video: Video,
  document: File,
  voice: Mic,
  location: MapPin,
  contact: Users,
} as const;

export function ChatRow({
  chat,
  title,
  hue,
  online,
  last,
  authorName,
  onLongPress,
}: {
  chat: Chat;
  title: string;
  hue: number;
  online?: boolean | undefined;
  last?: Message | undefined;
  authorName?: string | undefined;
  onLongPress?: ((chat: Chat) => void) | undefined;
}) {
  const AttachIcon = last?.attachment ? attachmentIcon[last.attachment.kind] : null;
  const mine = last?.authorId === ME_ID;

  const preview = () => {
    if (chat.typing) return <span className="font-medium text-accent">typing…</span>;
    if (!last) return <span className="italic">No messages yet</span>;
    if (last.deleted) return <span className="italic">Message deleted</span>;
    const body =
      last.text ??
      last.attachment?.caption ??
      last.attachment?.name ??
      (last.attachment ? `${last.attachment.kind[0]?.toUpperCase()}${last.attachment.kind.slice(1)}` : "");
    return (
      <>
        {AttachIcon && <AttachIcon className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />}
        {chat.kind === "group" && !last.system && (
          <span className="font-medium">{mine ? "You" : (authorName ?? "")}: </span>
        )}
        {body}
      </>
    );
  };

  let pressTimer: ReturnType<typeof setTimeout> | null = null;

  return (
    <Link
      to="/chat/$chatId"
      params={{ chatId: chat.id }}
      onPointerDown={() => {
        if (onLongPress) pressTimer = setTimeout(() => onLongPress(chat), 480);
      }}
      onPointerUp={() => pressTimer && clearTimeout(pressTimer)}
      onPointerLeave={() => pressTimer && clearTimeout(pressTimer)}
      className="flex items-center gap-3 px-4 py-2.5 transition-colors active:bg-secondary/70"
    >
      <UserAvatar name={title} hue={hue} size="md" online={online} square={chat.kind === "group"} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold">{title}</h3>
          <span
            className={cn(
              "shrink-0 text-[11px]",
              chat.unreadCount ? "font-semibold text-primary" : "text-muted-foreground",
            )}
          >
            {last ? listTime(last.createdAt) : ""}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          {mine && last && !last.deleted && !last.system && !chat.typing && (
            <span className="shrink-0 text-muted-foreground">
              {last.status === "read" ? (
                <CheckCheck className="h-3.5 w-3.5 text-accent" />
              ) : last.status === "delivered" ? (
                <CheckCheck className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
          )}
          <p className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">{preview()}</p>
          {chat.muted && <BellOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          {chat.pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          {chat.unreadCount > 0 && (
            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-unread px-1.5 text-[11px] font-bold text-unread-foreground">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
