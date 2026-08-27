import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomTabs } from "./BottomTabs";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-background shadow-soft md:my-0 md:min-h-screen">
      {children}
    </div>
  );
}

export function TabScreen({
  title,
  actions,
  children,
  subtitle,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <PhoneFrame>
      <header className="safe-top sticky top-0 z-30 border-b border-border/70 bg-background/92 px-4 pb-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold">{title}</h1>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
        </div>
      </header>
      <main className="flex-1 pb-2">{children}</main>
      <BottomTabs />
    </PhoneFrame>
  );
}

export function StackScreen({
  title,
  subtitle,
  back = "/chats",
  actions,
  children,
  hero,
  contentClassName,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  back?: string;
  actions?: ReactNode;
  children: ReactNode;
  hero?: ReactNode;
  contentClassName?: string;
}) {
  return (
    <PhoneFrame>
      <header className="safe-top sticky top-0 z-30 border-b border-border/70 bg-background/92 px-2 pb-2 backdrop-blur-xl">
        <div className="flex items-center gap-1">
          <Link
            to={back}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary"
            aria-label="Back"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          {hero ?? (
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold">{title}</h1>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          )}
          {actions && <div className="flex shrink-0 items-center gap-0.5">{actions}</div>}
        </div>
      </header>
      <main className={cn("safe-bottom flex-1", contentClassName)}>{children}</main>
    </PhoneFrame>
  );
}

export function IconButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary active:scale-95",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function EmptyState({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-10 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-secondary text-muted-foreground">
        {icon}
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
