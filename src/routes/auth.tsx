import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import logo from "@/assets/pingora-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Pingora" },
      {
        name: "description",
        content: "Create your Pingora account or sign back in with your phone number.",
      },
      { property: "og:title", content: "Sign in to Pingora" },
      { property: "og:description", content: "Create your Pingora account in seconds." },
    ],
  }),
  component: AuthScreen,
});

type Step = "phone" | "code" | "profile";

function AuthScreen() {
  const { signIn } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+1 415 555 0142");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const finish = () => {
    signIn(name || "You", phone);
    toast.success("Welcome to Pingora");
    void navigate({ to: "/chats", replace: true });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-background px-6">
      <header className="safe-top flex items-center gap-2 pb-6">
        {step === "phone" ? (
          <Link to="/" aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary">
            <ChevronLeft className="h-6 w-6" />
          </Link>
        ) : (
          <button
            type="button"
            aria-label="Back"
            onClick={() => setStep(step === "code" ? "phone" : "code")}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <img src={logo} alt="" width={28} height={28} className="h-7 w-7" />
        <span className="font-display font-bold">Pingora</span>
      </header>

      <div className="flex-1">
        {step === "phone" && (
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              setStep("code");
              toast("Verification code sent", { description: "Demo code: any 6 digits" });
            }}
          >
            <div>
              <h1 className="text-3xl font-extrabold">What's your number?</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We'll send a one-time code to verify this device.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-13 rounded-2xl text-base"
              />
            </div>
            <Button type="submit" size="lg" className="h-13 w-full rounded-full text-base">
              Send code
            </Button>
          </form>
        )}

        {step === "code" && (
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.replace(/\D/g, "").length < 6) {
                toast.error("Enter the 6-digit code");
                return;
              }
              setStep("profile");
            }}
          >
            <div>
              <h1 className="text-3xl font-extrabold">Enter your code</h1>
              <p className="mt-2 text-sm text-muted-foreground">Sent to {phone}</p>
            </div>
            <Input
              autoFocus
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="––––––"
              className="h-16 rounded-2xl text-center font-display text-3xl tracking-[0.5em]"
            />
            <Button type="submit" size="lg" className="h-13 w-full rounded-full text-base">
              Verify
            </Button>
            <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4" /> Codes expire after 5 minutes
            </p>
          </form>
        )}

        {step === "profile" && (
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              finish();
            }}
          >
            <div>
              <h1 className="text-3xl font-extrabold">Set up your profile</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your name and photo are visible to people you chat with.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="h-13 rounded-2xl text-base"
              />
            </div>
            <Button type="submit" size="lg" className="h-13 w-full rounded-full text-base">
              Start messaging
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
