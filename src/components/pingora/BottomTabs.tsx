import { Link, useRouterState } from "@tanstack/react-router";
import { MessageCircle, CircleDashed, Users, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

const tabs = [
  { to: "/chats", label: "Chats", icon: MessageCircle },
  { to: "/updates", label: "Updates", icon: CircleDashed },
  { to: "/communities", label: "Communities", icon: Users },
  { to: "/calls", label: "Calls", icon: Phone },
] as const;

export function BottomTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { chats, statuses } = useStore();
  const unread = chats
    .filter((c) => !c.archived)
    .reduce((sum, c) => sum + (c.unreadCount > 0 ? 1 : 0), 0);
  const freshStatuses = statuses.filter((s) => !s.viewed && s.userId !== "me").length;

  const badge = (to: string) => {
    if (to === "/chats" && unread) return unread;
    if (to === "/updates" && freshStatuses) return freshStatuses;
    return 0;
  };

  return (
    <nav
      className="safe-bottom sticky bottom-0 z-30 border-t border-border bg-card/95 pt-1 backdrop-blur-xl"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(`${to}/`);
          const count = badge(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "relative grid h-8 w-14 place-items-center rounded-full transition-colors",
                    active && "bg-primary/12",
                  )}
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.9} />
                  {count > 0 && (
                    <span className="absolute top-0 right-3 grid h-4 min-w-4 place-items-center rounded-full bg-unread px-1 text-[10px] font-bold text-unread-foreground">
                      {count}
                    </span>
                  )}
                </span>
                <span className={cn("text-[11px]", active && "font-semibold")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
