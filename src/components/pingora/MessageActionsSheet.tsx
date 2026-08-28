import { Copy, Forward, Pencil, Reply, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { Message } from "@/lib/types";
import { quickReactions } from "./EmojiPicker";
import { useStore } from "@/lib/store";

export function MessageActionsSheet({
  message,
  onOpenChange,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onForward,
  onStar,
}: {
  message: Message | null;
  onOpenChange: (v: boolean) => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onForward: () => void;
  onStar: () => void;
}) {
  const { meId } = useStore();
  const mine = message?.authorId === meId;
  const actions = [
    { label: "Reply", icon: Reply, run: onReply, show: !message?.deleted },
    {
      label: "Copy",
      icon: Copy,
      show: !!message?.text,
      run: () => {
        void navigator.clipboard?.writeText(message?.text ?? "");
        toast.success("Copied to clipboard");
      },
    },
    { label: "Forward", icon: Forward, run: onForward, show: !message?.deleted },
    {
      label: message?.starred ? "Unstar" : "Star",
      icon: Star,
      run: onStar,
      show: !message?.deleted,
    },
    { label: "Edit", icon: Pencil, run: onEdit, show: !!mine && !message?.deleted && !!message?.text },
    { label: "Delete", icon: Trash2, run: onDelete, show: !message?.deleted, danger: true },
  ].filter((a) => a.show);

  return (
    <Sheet open={!!message} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-4xl border-border pb-8">
        <div className="flex justify-between gap-1 px-4 pt-4">
          {quickReactions.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                onReact(e);
                onOpenChange(false);
              }}
              className="grid h-11 w-11 place-items-center rounded-full text-2xl transition-transform hover:bg-secondary active:scale-90"
            >
              {e}
            </button>
          ))}
        </div>
        <ul className="mt-3 px-2">
          {actions.map((a) => (
            <li key={a.label}>
              <button
                type="button"
                onClick={() => {
                  a.run();
                  onOpenChange(false);
                }}
                className={
                  "flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left text-[15px] transition-colors hover:bg-secondary " +
                  ("danger" in a && a.danger ? "text-destructive" : "")
                }
              >
                <a.icon className="h-5 w-5" />
                {a.label}
              </button>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
