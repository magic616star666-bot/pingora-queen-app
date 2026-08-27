import { useState } from "react";
import { Check } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { UserAvatar } from "./UserAvatar";
import { cn } from "@/lib/utils";

export function ForwardSheet({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (chatIds: string[]) => void;
}) {
  const { chats, chatTitle, chatHue } = useStore();
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) setPicked([]);
        onOpenChange(v);
      }}
    >
      <SheetContent side="bottom" className="flex h-[80vh] flex-col rounded-t-4xl border-border">
        <SheetHeader className="text-left">
          <SheetTitle className="text-base">Forward to…</SheetTitle>
        </SheetHeader>
        <ul className="-mx-2 flex-1 overflow-y-auto px-2">
          {chats.map((c) => {
            const active = picked.includes(c.id);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => toggle(c.id)}
                  className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-secondary"
                >
                  <UserAvatar
                    name={chatTitle(c)}
                    hue={chatHue(c)}
                    size="sm"
                    square={c.kind === "group"}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{chatTitle(c)}</span>
                  <span
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-full border",
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {active && <Check className="h-3.5 w-3.5" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <Button
          className="mt-2 w-full"
          disabled={!picked.length}
          onClick={() => {
            onConfirm(picked);
            setPicked([]);
            onOpenChange(false);
          }}
        >
          Forward{picked.length ? ` to ${picked.length}` : ""}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
