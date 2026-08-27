import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Check, Pencil } from "lucide-react";
import { toast } from "sonner";
import { StackScreen } from "@/components/pingora/AppShell";
import { UserAvatar } from "@/components/pingora/UserAvatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My profile · Pingora" },
      { name: "description", content: "Edit your Pingora name, photo, about text and phone number." },
      { property: "og:title", content: "My profile · Pingora" },
      { property: "og:description", content: "Edit your Pingora name, photo and about text." },
    ],
  }),
  component: ProfileScreen,
});

function ProfileScreen() {
  const { me, updateProfile } = useStore();
  const [editing, setEditing] = useState<"name" | "about" | null>(null);
  const [name, setName] = useState(me.name);
  const [about, setAbout] = useState(me.about);

  return (
    <StackScreen back="/settings" title="Profile">
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="relative">
          <UserAvatar name={me.name} hue={me.hue} size="xl" />
          <button
            type="button"
            onClick={() => toast("Photo picker connects to media storage next")}
            aria-label="Change photo"
            className="absolute right-0 bottom-0 grid h-9 w-9 place-items-center rounded-full aurora-bg text-primary-foreground shadow-float"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Tap the camera to change your photo</p>
      </div>

      <ul className="space-y-2 px-4 pb-10">
        <li className="rounded-3xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Name
          </p>
          {editing === "name" ? (
            <div className="mt-2 flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-2xl" />
              <button
                type="button"
                aria-label="Save name"
                onClick={() => {
                  updateProfile({ name: name.trim() || me.name });
                  setEditing(null);
                  toast.success("Profile updated");
                }}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl aurora-bg text-primary-foreground"
              >
                <Check className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing("name")}
              className="mt-1 flex w-full items-center justify-between text-left"
            >
              <span className="text-[15px]">{me.name}</span>
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </li>

        <li className="rounded-3xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            About
          </p>
          {editing === "about" ? (
            <div className="mt-2 space-y-2">
              <Textarea
                rows={2}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="rounded-2xl"
              />
              <button
                type="button"
                onClick={() => {
                  updateProfile({ about: about.trim() });
                  setEditing(null);
                  toast.success("About updated");
                }}
                className="w-full rounded-full aurora-bg py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing("about")}
              className="mt-1 flex w-full items-center justify-between gap-3 text-left"
            >
              <span className="text-[15px]">{me.about}</span>
              <Pencil className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          )}
        </li>

        <li className="rounded-3xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Phone
          </p>
          <p className="mt-1 text-[15px]">{me.phone}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your number is only shared with people you chat with.
          </p>
        </li>
      </ul>
    </StackScreen>
  );
}
