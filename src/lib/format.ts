const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function clockTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function listTime(ts: number) {
  const now = Date.now();
  const sameDay = new Date(ts).toDateString() === new Date(now).toDateString();
  if (sameDay) return clockTime(ts);
  if (now - ts < 2 * DAY) return "Yesterday";
  if (now - ts < 7 * DAY) return new Date(ts).toLocaleDateString([], { weekday: "short" });
  return new Date(ts).toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function dayLabel(ts: number) {
  const now = Date.now();
  const d = new Date(ts).toDateString();
  if (d === new Date(now).toDateString()) return "Today";
  if (d === new Date(now - DAY).toDateString()) return "Yesterday";
  return new Date(ts).toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
}

export function lastSeenLabel(ts?: number) {
  if (!ts) return "offline";
  const diff = Date.now() - ts;
  if (diff < 2 * MIN) return "last seen just now";
  if (diff < HOUR) return `last seen ${Math.round(diff / MIN)} min ago`;
  if (diff < DAY) return `last seen today at ${clockTime(ts)}`;
  return `last seen ${listTime(ts)}`;
}

export function agoLabel(ts: number) {
  const diff = Date.now() - ts;
  if (diff < MIN) return "just now";
  if (diff < HOUR) return `${Math.round(diff / MIN)}m ago`;
  if (diff < DAY) return `${Math.round(diff / HOUR)}h ago`;
  return `${Math.round(diff / DAY)}d ago`;
}

export function duration(sec?: number) {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
