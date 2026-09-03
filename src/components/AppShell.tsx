import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AppShell({ children, email }: { children: ReactNode; email?: string | null | undefined }) {
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-line bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-3 px-4 sm:gap-6 sm:px-6">
          <Link to="/" className="font-display text-lg leading-none tracking-wide">
            HUB MANAGER TOUR<span className="text-signal">.</span>
          </Link>
          <nav className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:gap-6">
            <Link to="/" activeProps={{ className: "text-foreground" }}>
              Agenda
            </Link>
            <Link to="/settings" activeProps={{ className: "text-foreground" }}>
              Configurações
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {email ? (
              <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
                {email}
              </span>
            ) : null}
            <button
              onClick={signOut}
              className="border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors hover:bg-foreground hover:text-background"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
