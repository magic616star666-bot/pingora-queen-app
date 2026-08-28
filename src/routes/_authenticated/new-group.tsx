import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { StackScreen } from "@/components/pingora/AppShell";
import { UserAvatar } from "@/components/pingora/UserAvatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/new-group")({
  head: () => ({
    meta: [
      { title: "New group · Pingora" },
      { name: "description", content: "Pick members and create a new Pingora group chat." },
      { property: "og:title", content: "New group · Pingora" },
      { property: "og:description", content: "Create a group, add members and start talking." },
    ],
  }),
  component: NewGroup,
});

function NewGroup() {
  const { contacts, createGroup } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<"members" | "details">("members");
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <StackScreen
      back="/chats"
      title={step === "members" ? "Add members" : "Group details"}
      subtitle={step === "members" ? `${picked.length} selected` : name || "Name your group"}
    >
      {step === "members" ? (
        <>
          <ul className="pt-1 pb-28">
            {contacts.map((u) => {
              const active = picked.includes(u.id);
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setPicked((p) => (active ? p.filter((x) => x !== u.id) : [...p, u.id]))
                    }
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-secondary/70"
                  >
                    <UserAvatar name={u.name} hue={u.hue} size="md" online={u.online} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{u.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{u.about}</span>
                    </span>
                    <span
                      className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-full border",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border",
                      )}
                    >
                      {active && <Check className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            disabled={!picked.length}
            onClick={() => setStep("details")}
            className="fixed right-5 bottom-8 grid h-14 w-14 place-items-center rounded-3xl aurora-bg text-primary-foreground shadow-float disabled:opacity-40 md:right-[max(1.25rem,calc(50%-14rem))]"
            aria-label="Continue"
          >
            <ArrowRight className="h-6 w-6" />
          </button>
        </>
      ) : (
        <div className="space-y-5 px-4 py-5">
          <div className="flex items-center gap-3">
            <UserAvatar name={name || "New group"} hue={200} size="lg" square />
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name"
              className="h-12 rounded-2xl text-base"
            />
          </div>
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Group description (optional)"
            className="rounded-2xl"
          />
          <p className="text-xs text-muted-foreground">
            {picked.length + 1} members including you.
          </p>
          <Button
            className="h-12 w-full rounded-full"
            disabled={!name.trim()}
            onClick={() => {
              void (async () => {
                try {
                  const id = await createGroup(name.trim(), picked, description.trim() || undefined);
                  toast.success("Group created");
                  void navigate({ to: "/chat/$chatId", params: { chatId: id } });
                } catch {
                  /* error surfaced by the store */
                }
              })();
            }}
          >
            Create group
          </Button>
        </div>
      )}
    </StackScreen>
  );
}
