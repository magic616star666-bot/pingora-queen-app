import { Camera, File, Image as ImageIcon, MapPin, User2, Video } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Attachment } from "@/lib/types";

const options: {
  kind: Attachment["kind"];
  label: string;
  icon: typeof ImageIcon;
  hue: number;
  build: () => Attachment;
}[] = [
  {
    kind: "image",
    label: "Photo",
    icon: ImageIcon,
    hue: 205,
    build: () => ({ kind: "image", caption: "" }),
  },
  {
    kind: "video",
    label: "Video",
    icon: Video,
    hue: 32,
    build: () => ({ kind: "video", name: "clip.mp4" }),
  },
  {
    kind: "image",
    label: "Camera",
    icon: Camera,
    hue: 285,
    build: () => ({ kind: "image", caption: "Taken just now" }),
  },
  {
    kind: "document",
    label: "Document",
    icon: File,
    hue: 155,
    build: () => ({ kind: "document", name: "notes.pdf", size: "128 KB" }),
  },
  {
    kind: "location",
    label: "Location",
    icon: MapPin,
    hue: 250,
    build: () => ({ kind: "location", name: "Current location" }),
  },
  {
    kind: "contact",
    label: "Contact",
    icon: User2,
    hue: 85,
    build: () => ({ kind: "contact", name: "Shared contact" }),
  },
];

export function AttachmentSheet({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (a: Attachment) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-4xl border-border pb-8">
        <SheetHeader className="text-left">
          <SheetTitle className="text-base">Share something</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-3 gap-3 px-4 pt-2">
          {options.map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => onPick(o.build())}
              className="flex flex-col items-center gap-2 rounded-2xl py-3 transition-colors hover:bg-secondary active:scale-95"
            >
              <span
                className="grid h-14 w-14 place-items-center rounded-2xl text-primary-foreground"
                style={{
                  background: `linear-gradient(140deg, oklch(0.72 0.15 ${o.hue}), oklch(0.6 0.14 ${(o.hue + 40) % 360}))`,
                }}
              >
                <o.icon className="h-6 w-6" />
              </span>
              <span className="text-xs font-medium">{o.label}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
