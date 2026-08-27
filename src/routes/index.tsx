import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Lock, Radio, Users } from "lucide-react";
import logo from "@/assets/pingora-logo.png";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pingora — Messaging that feels instant" },
      {
        name: "description",
        content:
          "Pingora is a fast, private messenger with chats, groups, 24-hour updates, communities and calls. Built mobile-first and installable on Android.",
      },
      { property: "og:title", content: "Pingora — Messaging that feels instant" },
      {
        property: "og:description",
        content:
          "Chats, groups, updates, communities and calls in one calm, fast app. Install Pingora on your phone.",
      },
    ],
  }),
  component: Welcome,
});

const slides = [
  {
    icon: Radio,
    title: "Messages that land instantly",
    body: "Delivery and read states, typing hints and reactions — all in real time.",
  },
  {
    icon: Users,
    title: "Groups and communities",
    body: "Bring your people together with threads, pins and shared updates.",
  },
  {
    icon: Lock,
    title: "Private by default",
    body: "Your chats stay yours. Granular privacy controls on every screen.",
  },
];

function Welcome() {
  const { authed, ready } = useStore();
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (ready && authed) void navigate({ to: "/chats", replace: true });
  }, [ready, authed, navigate]);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 4200);
    return () => clearInterval(t);
  }, []);

  const Active = slides[slide]!;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-background px-6">
      <header className="safe-top flex items-center gap-3 pb-4">
        <img src={logo} alt="Pingora logo" width={40} height={40} className="h-10 w-10" />
        <span className="font-display text-xl font-extrabold tracking-tight">Pingora</span>
      </header>

      <div className="flex flex-1 flex-col justify-center gap-10 py-6">
        <div className="relative mx-auto grid h-56 w-56 place-items-center">
          <div className="absolute inset-0 rounded-full aurora-bg opacity-15 blur-2xl" />
          <img
            src={logo}
            alt="Pingora aurora speech mark"
            width={224}
            height={224}
            className="relative h-52 w-52 drop-shadow-xl"
          />
        </div>

        <div>
          <h1 className="text-4xl leading-tight font-extrabold">
            Say it once.
            <br />
            <span className="aurora-text">Everyone hears it.</span>
          </h1>
          <p className="mt-3 text-[15px] text-muted-foreground">
            Chats, groups, 24-hour updates, communities and calls — in one calm, quick app.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl aurora-bg text-primary-foreground">
              <Active.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">{Active.title}</h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">{Active.body}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.title}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setSlide(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === slide ? "w-6 bg-primary" : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="safe-bottom space-y-3 pb-2">
        <Button asChild size="lg" className="h-13 w-full rounded-full text-base">
          <Link to="/auth">
            Get started <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to Pingora's Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
