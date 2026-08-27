import { cn } from "@/lib/utils";

const sizes = {
  xs: "h-8 w-8 text-[11px]",
  sm: "h-10 w-10 text-xs",
  md: "h-14 w-14 text-base",
  lg: "h-20 w-20 text-2xl",
  xl: "h-28 w-28 text-4xl",
} as const;

export interface UserAvatarProps {
  name: string;
  initials?: string | undefined;
  hue?: number | undefined;
  size?: keyof typeof sizes | undefined;
  online?: boolean | undefined;
  ring?: "none" | "unseen" | "seen" | undefined;
  className?: string | undefined;
  square?: boolean | undefined;
}

/**
 * Identity avatar. Per-person colour is data (a hue stored on the user), so it
 * is rendered through an inline oklch gradient rather than a fixed token.
 */
export function UserAvatar({
  name,
  initials,
  hue = 32,
  size = "sm",
  online,
  ring = "none",
  className,
  square,
}: UserAvatarProps) {
  const label =
    initials ??
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");

  const inner = (
    <div
      className={cn(
        "grid shrink-0 place-items-center font-display font-semibold text-primary-foreground select-none",
        square ? "rounded-2xl" : "rounded-full",
        sizes[size],
        className,
      )}
      style={{
        background: `linear-gradient(140deg, oklch(0.72 0.15 ${hue}), oklch(0.6 0.14 ${(hue + 45) % 360}))`,
      }}
      aria-hidden="true"
    >
      {label}
    </div>
  );

  return (
    <div className="relative shrink-0">
      {ring === "none" ? (
        inner
      ) : (
        <div
          className={cn("rounded-full p-[2.5px]", ring === "seen" && "opacity-45")}
          style={{
            background:
              ring === "unseen"
                ? `conic-gradient(from 200deg, oklch(0.72 0.16 32), oklch(0.72 0.13 205), oklch(0.72 0.16 32))`
                : "var(--color-border)",
          }}
        >
          <div className="rounded-full bg-background p-[2px]">{inner}</div>
        </div>
      )}
      {online && (
        <span
          className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-background bg-online"
          aria-label="online"
        />
      )}
    </div>
  );
}
