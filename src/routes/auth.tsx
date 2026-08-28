import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Loader2, Phone, ShieldCheck } from "lucide-react";
import logo from "@/assets/pingora-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Pingora" },
      {
        name: "description",
        content: "Create your Pingora account or sign back in to pick up every conversation.",
      },
      { property: "og:title", content: "Sign in to Pingora" },
      { property: "og:description", content: "Create your Pingora account in seconds." },
    ],
  }),
  component: AuthScreen,
});

type Mode = "signin" | "signup";

function AuthScreen() {
  const { signInWithEmail, signUpWithEmail, authed } = useStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authed) void navigate({ to: "/chats", replace: true });
  }, [authed, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(email.trim(), password);
        toast.success("Welcome back");
      } else {
        const { needsConfirmation } = await signUpWithEmail({
          email: email.trim(),
          password,
          name: name.trim(),
          phone: phone.trim(),
        });
        if (needsConfirmation) {
          toast("Check your email", {
            description: "Confirm your address to finish creating your account.",
          });
          setBusy(false);
          return;
        }
        toast.success("Welcome to Pingora");
      }
      void navigate({ to: "/chats", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-background px-6">
      <header className="safe-top flex items-center gap-2 pb-6">
        <Link
          to="/"
          aria-label="Back"
          className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <img src={logo} alt="" width={28} height={28} className="h-7 w-7" />
        <span className="font-display font-bold">Pingora</span>
      </header>

      <div className="flex-1">
        <h1 className="text-3xl font-extrabold">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signup"
            ? "Your account keeps chats, groups and profile in sync on every device."
            : "Sign in to pick up right where you left off."}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
          {(["signup", "signin"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-full py-2 text-sm font-semibold transition-colors",
                mode === m ? "bg-card text-foreground shadow-soft" : "text-muted-foreground",
              )}
            >
              {m === "signup" ? "Sign up" : "Sign in"}
            </button>
          ))}
        </div>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="h-13 rounded-2xl text-base"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-13 rounded-2xl text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="h-13 rounded-2xl text-base"
            />
          </div>

          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Phone number{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 415 555 0142"
                className="h-13 rounded-2xl text-base"
              />
              <p className="text-xs text-muted-foreground">
                Saved to your profile so contacts can find you. One-time SMS codes switch on once an
                SMS provider is connected.
              </p>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={busy}
            className="h-13 w-full rounded-full text-base"
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "signup" ? "Create account" : "Sign in"}
          </Button>

          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" /> Your messages are private to your conversations
          </p>
        </form>
      </div>
    </div>
  );
}
