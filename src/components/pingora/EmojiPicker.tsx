const groups: { label: string; emojis: string[] }[] = [
  {
    label: "Frequent",
    emojis: ["😂", "❤️", "🔥", "👍", "🙏", "🎉", "😮", "😢", "🚀", "✨", "👀", "💯"],
  },
  {
    label: "Smileys",
    emojis: [
      "😀", "😅", "🤣", "🙂", "😉", "😍", "🤩", "😘", "😗", "😙", "🤗", "🤔",
      "🤨", "😐", "😑", "🙄", "😏", "😴", "🤤", "😷", "🤒", "🥳",
    ],
  },
  {
    label: "Gestures",
    emojis: ["👋", "🤚", "✌️", "🤞", "🤟", "🤙", "👈", "👉", "👆", "👇", "👏", "🙌"],
  },
  {
    label: "Life",
    emojis: ["🍕", "🍜", "☕", "🍰", "🏔️", "🌊", "🌙", "⭐", "🐈", "🐕", "🎧", "📷"],
  },
];

export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <div className="max-h-64 overflow-y-auto px-1 pb-2">
      {groups.map((g) => (
        <div key={g.label} className="mb-2">
          <p className="px-2 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {g.label}
          </p>
          <div className="grid grid-cols-8 gap-1">
            {g.emojis.map((e) => (
              <button
                key={`${g.label}-${e}`}
                type="button"
                onClick={() => onPick(e)}
                className="grid h-9 place-items-center rounded-xl text-xl transition-colors hover:bg-secondary active:scale-90"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
