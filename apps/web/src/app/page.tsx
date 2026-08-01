import Link from "next/link";
import { NavBar } from "@/components/nav-bar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Glow effect */}
        <div className="pointer-events-none absolute -top-32 h-96 w-96 rounded-full bg-primary/20 blur-[140px]" />

        <div className="relative flex flex-col items-center gap-8 text-center max-w-3xl">
          <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
            <span>✨ Step 2 Auth — Operational</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-3xl shadow-inner">
              🌿
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
              Clean<span className="text-primary">City</span>
            </h1>
          </div>

          <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
            Report waste locations with photos & GPS. Municipal staff & admins triage, assign, and resolve reports to keep our cities clean and green.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/citizen"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-105 active:scale-95"
            >
              Citizen Portal
            </Link>
            <Link
              href="/admin"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-8 text-sm font-semibold shadow-sm transition-all hover:bg-accent hover:scale-105 active:scale-95"
            >
              Admin Dashboard
            </Link>
          </div>

          {/* Quick links & feature tags */}
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
            {["JWT Auth ✓", "Role Guards ✓", "Email/Password ✓", "Refresh Flow ✓"].map(
              (label) => (
                <span
                  key={label}
                  className="rounded-full border border-border bg-card/60 px-3 py-1 backdrop-blur-sm"
                >
                  {label}
                </span>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
