import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — G3 Hub Manager" },
      {
        name: "description",
        content:
          "Acesso do administrador do G3 Hub Manager para gerenciar shows, elenco e documentos de turnê.",
      },
      { property: "og:title", content: "Entrar — G3 Hub Manager" },
      {
        property: "og:description",
        content: "Acesso do administrador do G3 Hub Manager para gerenciar a logística de turnê.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const { session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) router.navigate({ to: "/" });
  }, [session, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setBusy(false);
  }

  async function google() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    router.navigate({ to: "/" });
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="label-mono">Acesso restrito · administração</p>
        <h1 className="mt-2 font-display text-5xl leading-[0.9]">G3 HUB MANAGER</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Prancheta de turnê: elenco, documentos e pendências de cada show.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4 border border-line p-5">
          <div>
            <label className="label-mono" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-signal"
            />
          </div>
          <div>
            <label className="label-mono" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-signal"
            />
          </div>

          {error ? <p className="font-mono text-[11px] text-destructive">{error}</p> : null}
          {info ? <p className="font-mono text-[11px] text-ok">{info}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-foreground py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-background transition-colors hover:bg-signal disabled:opacity-50"
          >
            Entrar
          </button>

          <button
            type="button"
            onClick={google}
            className="w-full border border-line py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-accent"
          >
            Entrar com Google
          </button>

          <p className="pt-1 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Acesso somente para o administrador
          </p>
        </form>
      </div>
    </div>
  );
}
