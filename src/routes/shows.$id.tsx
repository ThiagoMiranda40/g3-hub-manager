import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { AppShell } from "@/components/AppShell";
import { CAST_ROLES, DOC_TYPES, docTypeLabel, initials, roleLabel } from "@/lib/g3";

export const Route = createFileRoute("/shows/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe do show — G3 Hub" },
      {
        name: "description",
        content:
          "Elenco, pendências de documento e link público de envio para um show específico da turnê.",
      },
      { property: "og:title", content: "Detalhe do show — G3 Hub" },
      {
        property: "og:description",
        content: "Elenco, pendências e link de envio de documentos do show.",
      },
    ],
  }),
  component: ShowDetail,
});

function ShowDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { session, loading } = useSession();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("integrante");

  useEffect(() => {
    if (!loading && !session) router.navigate({ to: "/auth" });
  }, [loading, session, router]);

  const { data } = useQuery({
    queryKey: ["show", id],
    enabled: !!session,
    queryFn: async () => {
      const [{ data: show }, { data: cast }, { data: docs }] = await Promise.all([
        supabase
          .from("shows")
          .select("id, city, venue, show_date, public_token, artists(name), tours(name)")
          .eq("id", id)
          .maybeSingle(),
        supabase.from("cast_members").select("id, name, role").eq("show_id", id).order("name"),
        supabase
          .from("documents")
          .select("id, cast_member_id, doc_type, file_path, file_name, note, created_at")
          .eq("show_id", id)
          .order("created_at", { ascending: false }),
      ]);
      return { show, cast: cast ?? [], docs: docs ?? [] };
    },
  });

  const addMember = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Sessão expirada");
      const { error } = await supabase
        .from("cast_members")
        .insert({ show_id: id, name, role, user_id: userId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setName("");
      qc.invalidateQueries({ queryKey: ["show", id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  async function openDocument(path: string) {
    const { data } = await supabase.storage.from("documentos").createSignedUrl(path, 60 * 10);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }

  if (loading || !session) return null;

  const show = data?.show;
  const cast = data?.cast ?? [];
  const docs = data?.docs ?? [];
  const publicUrl =
    typeof window !== "undefined" && show
      ? `${window.location.origin}/p/${show.public_token}`
      : "";
  const pendingPeople = cast.filter(
    (m) => DOC_TYPES.some((t) => !docs.some((d) => d.cast_member_id === m.id && d.doc_type === t.value)),
  ).length;

  return (
    <AppShell email={session.user.email}>
      <Link to="/" className="label-mono hover:text-foreground">
        ← Voltar para a agenda
      </Link>

      {!show ? (
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Show não encontrado
        </p>
      ) : (
        <>
          <section className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
            <div>
              <p className="label-mono">
                {show.tours?.name ? `Tour ${show.tours.name}` : "Show avulso"}
              </p>
              <h1 className="mt-2 text-4xl leading-none sm:text-5xl">
                {show.artists?.name ?? "SEM ARTISTA"}
              </h1>
              <p className="mt-2 font-mono text-[11px] uppercase text-muted-foreground">
                {show.city}
                {show.venue ? ` · ${show.venue}` : ""} · {show.show_date}
              </p>
            </div>
            <div className="text-right font-mono text-[11px] leading-tight">
              <div className="text-muted-foreground">ELENCO</div>
              <div className={pendingPeople ? "font-medium text-signal" : "font-medium text-ok"}>
                {pendingPeople ? `${pendingPeople} pendentes` : "tudo recebido"}
              </div>
            </div>
          </section>

          <section className="mt-6 flex flex-wrap items-center justify-between gap-4 border border-line bg-accent/40 px-5 py-4">
            <div className="font-mono text-[11px] leading-tight">
              <div className="label-mono">Link público de envio</div>
              <div className="mt-1 break-all">{publicUrl}</div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="bg-foreground px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-background transition-colors hover:bg-signal"
            >
              {copied ? "Copiado" : "Copiar link"}
            </button>
          </section>

          <section className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="label-mono mb-4">(c) Elenco · {cast.length} pessoas</div>
              <div className="border border-line">
                <div className="px-5">
                  {cast.length === 0 ? (
                    <p className="py-8 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Adicione as pessoas do show
                    </p>
                  ) : null}
                  {cast.map((m) => (
                    <div key={m.id} className="flex flex-wrap items-center gap-3 border-b border-line py-3 last:border-b-0">
                      <div className="grid size-8 shrink-0 place-items-center border border-line font-mono text-[11px]">
                        {initials(m.name)}
                      </div>
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="truncate text-sm font-medium">{m.name}</div>
                        <div className="label-mono">{roleLabel(m.role)}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {DOC_TYPES.map((t) => {
                          const ok = docs.some(
                            (d) => d.cast_member_id === m.id && d.doc_type === t.value,
                          );
                          return (
                            <span
                              key={t.value}
                              className={
                                ok
                                  ? "border border-ok px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ok"
                                  : "bg-signal px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-signal-foreground"
                              }
                            >
                              {t.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addMember.mutate();
                  }}
                  className="flex flex-wrap items-end gap-3 border-t border-line bg-accent/30 px-5 py-4"
                >
                  <label className="min-w-40 flex-1">
                    <span className="label-mono">Nome</span>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1.5 w-full border border-line bg-background px-3 py-2 text-sm outline-none focus:border-signal"
                    />
                  </label>
                  <label>
                    <span className="label-mono">Função</span>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="mt-1.5 border border-line bg-background px-3 py-2 text-sm outline-none focus:border-signal"
                    >
                      {CAST_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="submit"
                    disabled={addMember.isPending}
                    className="bg-foreground px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-background disabled:opacity-50"
                  >
                    Adicionar
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="label-mono mb-4">(d) Documentos recebidos · {docs.length}</div>
              <div className="border border-line">
                {cast.length === 0 ? (
                  <p className="px-5 py-8 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Sem elenco
                  </p>
                ) : null}
                {cast.map((m) => {
                  const mine = docs.filter((d) => d.cast_member_id === m.id);
                  return (
                    <div key={m.id} className="border-b border-line px-5 py-4 last:border-b-0">
                      <div className="text-sm font-medium">{m.name}</div>
                      {mine.length === 0 ? (
                        <p className="label-mono mt-1">Nada enviado</p>
                      ) : (
                        <ul className="mt-2 space-y-1.5">
                          {mine.map((d) => (
                            <li key={d.id} className="flex items-center gap-2">
                              <span className="border border-ok px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ok">
                                {docTypeLabel(d.doc_type)}
                              </span>
                              <button
                                onClick={() => openDocument(d.file_path)}
                                className="truncate font-mono text-[11px] underline-offset-2 hover:underline"
                              >
                                {d.file_name ?? "abrir arquivo"}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
