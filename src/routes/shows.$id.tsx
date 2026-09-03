import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useCatalog } from "@/hooks/useCatalog";
import { AppShell } from "@/components/AppShell";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Skeleton } from "@/components/Skeleton";

import { computeShowProgress, formatBRL, initials, labelFrom } from "@/lib/g3";

export const Route = createFileRoute("/shows/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe do show — Hub Manager Tour" },
      {
        name: "description",
        content:
          "Elenco, pendências de documento e link público de envio para um show específico da turnê.",
      },
      { property: "og:title", content: "Detalhe do show — Hub Manager Tour" },
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
  const [role, setRole] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const { roles, docTypes } = useCatalog(!!session);

  useEffect(() => {
    if (!loading && !session) router.navigate({ to: "/auth" });
  }, [loading, session, router]);

  useEffect(() => {
    if (!role && roles[0]) setRole(roles[0].id);
  }, [role, roles]);

  const { data, isLoading: isLoadingShow } = useQuery({
    queryKey: ["show", id],
    enabled: !!session,
    queryFn: async () => {
      const [{ data: show }, { data: cast }, { data: docs }] = await Promise.all([
        supabase
          .from("shows")
          .select(
            "id, city, venue, show_date, public_token, artist_id, tour_id, artists(name), tours(name)",
          )
          .eq("id", id)
          .maybeSingle(),
        supabase.from("cast_members").select("id, name, role").eq("show_id", id).order("name"),
        supabase
          .from("documents")
          .select(
            "id, cast_member_id, doc_type, file_path, file_name, note, amount, is_reimbursement, created_at",
          )

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

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("cast_members").delete().eq("id", memberId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["show", id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => setActionError(e.message),
  });

  const deleteDocument = useMutation({
    mutationFn: async (doc: { id: string; file_path: string }) => {
      if (doc.file_path) await supabase.storage.from("documentos").remove([doc.file_path]);
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setActionError(null);
      qc.invalidateQueries({ queryKey: ["show", id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => setActionError(e.message),
  });



  const deleteShow = useMutation({
    mutationFn: async () => {
      const paths = (data?.docs ?? []).map((d) => d.file_path).filter(Boolean);
      if (paths.length) await supabase.storage.from("documentos").remove(paths);
      const del = async (table: "documents" | "cast_members") => {
        const { error } = await supabase.from(table).delete().eq("show_id", id);
        if (error) throw new Error(error.message);
      };
      await del("documents");
      await del("cast_members");
      const { error } = await supabase.from("shows").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      router.navigate({ to: "/" });
    },
    onError: (e: Error) => setActionError(e.message),
  });

  async function openDocument(path: string) {
    const { data } = await supabase.storage.from("documentos").createSignedUrl(path, 60 * 10);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }

  if (loading || !session) return null;

  const show = data?.show;
  const cast = data?.cast ?? [];
  const docs = data?.docs ?? [];
  const progress = computeShowProgress(cast, docs, docTypes);
  const { hasRequirement, pendingPeople } = progress;
  

  const publicUrl =
    typeof window !== "undefined" && show
      ? `${window.location.origin}/p/${show.public_token}`
      : "";

  const reimbursableDocs = docs.filter((d) => d.is_reimbursement);
  const withAmount = reimbursableDocs.filter((d) => d.amount != null);
  const totalAmount = withAmount.reduce((sum, d) => sum + Number(d.amount ?? 0), 0);




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
              <div
                className={
                  !hasRequirement
                    ? "text-muted-foreground"
                    : pendingPeople
                      ? "font-medium text-signal"
                      : "font-medium text-ok"
                }
              >
                {!hasRequirement
                  ? "sem exigência configurada"
                  : pendingPeople
                    ? `${pendingPeople} pendentes`
                    : "tudo recebido"}
              </div>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Link
                  to="/shows/$id/ficha"
                  params={{ id }}
                  className="border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] hover:bg-accent"
                >
                  Ver ficha de produção
                </Link>
                <button

                  onClick={() => {
                    setEditing((v) => !v);
                    setConfirmDelete(false);
                    setActionError(null);
                  }}
                  className="border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] hover:bg-accent"
                >
                  {editing ? "Cancelar" : "Editar"}
                </button>
                <button
                  onClick={() => {
                    setConfirmDelete((v) => !v);
                    setEditing(false);
                    setConfirmText("");
                    setActionError(null);
                  }}
                  className="border border-destructive px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-destructive hover:bg-destructive/10"
                >
                  Excluir
                </button>
              </div>
            </div>
          </section>

          {editing ? (
            <EditShowForm
              show={show}
              onCancel={() => setEditing(false)}
              onSaved={() => {
                setEditing(false);
                qc.invalidateQueries({ queryKey: ["show", id] });
                qc.invalidateQueries({ queryKey: ["dashboard"] });
              }}
            />
          ) : null}

          {confirmDelete ? (
            <section className="mt-6 border border-destructive p-5">
              <div className="label-mono text-destructive">Excluir show</div>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed">
                Esta ação apaga <strong>permanentemente</strong> o show, as {cast.length} pessoas do
                elenco e os {docs.length} documento{docs.length === 1 ? "" : "s"} enviados
                (incluindo os arquivos). Não há como desfazer.
              </p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Para confirmar, digite a cidade do show: {show.city}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="border border-line bg-background px-3 py-2 text-sm outline-none focus:border-destructive"
                />
                <button
                  disabled={
                    confirmText.trim().toLowerCase() !== show.city.trim().toLowerCase() ||
                    deleteShow.isPending
                  }
                  onClick={() => deleteShow.mutate()}
                  className="bg-destructive px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-destructive-foreground disabled:opacity-40"
                >
                  Excluir definitivamente
                </button>
              </div>
              {actionError ? (
                <p className="mt-2 font-mono text-[11px] text-destructive">{actionError}</p>
              ) : null}
            </section>
          ) : null}


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
                  {cast.map((m) => {
                    const memberDocs = docs.filter((d) => d.cast_member_id === m.id).length;
                    return (
                    <div key={m.id} className="flex flex-wrap items-center gap-3 border-b border-line py-3 last:border-b-0">
                      <div className="grid size-8 shrink-0 place-items-center border border-line font-mono text-[11px]">
                        {initials(m.name)}
                      </div>
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="truncate text-sm font-medium">{m.name}</div>
                        <div className="label-mono">{labelFrom(roles, m.role)}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {docTypes.map((t) => {
                          const ok = docs.some(
                            (d) => d.cast_member_id === m.id && d.doc_type === t.id,
                          );
                          if (!t.required && !ok) return null;
                          return (
                            <span
                              key={t.id}
                              className={
                                ok
                                  ? "border border-ok px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ok"
                                  : "bg-signal px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-signal-foreground"
                              }
                            >
                              {t.name}
                            </span>
                          );
                        })}
                      </div>
                      {memberDocs > 0 ? (
                        <button
                          type="button"
                          title={`Não é possível excluir: ${memberDocs} documento${memberDocs === 1 ? "" : "s"} vinculado${memberDocs === 1 ? "" : "s"}`}
                          onClick={() =>
                            setActionError(
                              `${m.name} tem ${memberDocs} documento${memberDocs === 1 ? "" : "s"} enviado${memberDocs === 1 ? "" : "s"}. Exclua o${memberDocs === 1 ? "" : "s"} documento${memberDocs === 1 ? "" : "s"} antes de remover a pessoa.`,
                            )
                          }
                          className="shrink-0 border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
                        >
                          Excluir
                        </button>
                      ) : (
                        <ConfirmButton
                          title="Remover do elenco"
                          onConfirm={() => {
                            setActionError(null);
                            removeMember.mutate(m.id);
                          }}
                          className="shrink-0 border border-destructive px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-destructive hover:bg-destructive/10"
                          confirmClassName="shrink-0 border border-destructive bg-destructive/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-destructive"
                        />
                      )}

                    </div>
                    );
                  })}
                  {actionError && !confirmDelete ? (
                    <p className="pb-3 font-mono text-[11px] text-destructive">{actionError}</p>
                  ) : null}

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
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="submit"
                    disabled={addMember.isPending || !role}
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
                                {labelFrom(docTypes, d.doc_type)}
                              </span>
                              <button
                                onClick={() => openDocument(d.file_path)}
                                className="truncate font-mono text-[11px] underline-offset-2 hover:underline"
                              >
                                {d.file_name ?? "abrir arquivo"}
                              </button>
                              {d.amount != null ? (
                                <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">
                                  {formatBRL(Number(d.amount))}
                                </span>
                              ) : null}
                              <ConfirmButton
                                title="Excluir documento"
                                onConfirm={() =>
                                  deleteDocument.mutate({ id: d.id, file_path: d.file_path })
                                }
                                label="Excluir"
                                className={`${d.amount != null ? "" : "ml-auto "}shrink-0 border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:border-destructive hover:text-destructive`}
                                confirmClassName="shrink-0 border border-destructive bg-destructive/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-destructive"
                              />
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

          <section className="mt-10">
            <div className="label-mono mb-4">(e) Reembolsos</div>
            <div className="border border-line">
              <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-3">
                <div className="bg-background p-4">
                  <div className="label-mono">Documentos reembolsáveis</div>
                  <div className="mt-2 font-display text-3xl leading-none">
                    {reimbursableDocs.length}
                  </div>
                </div>
                <div className="bg-background p-4">
                  <div className="label-mono text-signal">Sem valor informado</div>
                  <div className="mt-2 font-display text-3xl leading-none">
                    {reimbursableDocs.length - withAmount.length}
                  </div>
                </div>
                <div className="bg-background p-4">
                  <div className="label-mono">Soma declarada</div>
                  <div className="mt-2 font-display text-3xl leading-none">
                    {formatBRL(totalAmount)}
                  </div>
                </div>
              </div>

              <div className="border-t border-line px-5 py-4">
                {withAmount.length === 0 ? (
                  <p className="label-mono">Nenhum valor informado até agora</p>
                ) : (
                  <div className="space-y-4">
                    {cast.map((m) => {
                      const items = withAmount.filter((d) => d.cast_member_id === m.id);
                      if (items.length === 0) return null;
                      const subtotal = items.reduce((s, d) => s + Number(d.amount ?? 0), 0);
                      return (
                        <div key={m.id}>
                          <div className="flex items-center justify-between text-sm font-medium">
                            <span>{m.name}</span>
                            <span className="font-mono text-[11px]">{formatBRL(subtotal)}</span>
                          </div>
                          <ul className="mt-1 space-y-1">
                            {items.map((d) => (
                              <li
                                key={d.id}
                                className="flex items-center justify-between gap-3 font-mono text-[11px] text-muted-foreground"
                              >
                                <span className="truncate">
                                  {labelFrom(docTypes, d.doc_type)} ·{" "}
                                  {d.file_name ?? "arquivo"}
                                </span>
                                <span className="shrink-0">{formatBRL(Number(d.amount))}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="mt-4 border-t border-line pt-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
                  Valores auto-declarados por quem enviou o documento, sem conferência automática.
                  Este é um resumo operacional, não um relatório fiscal.
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

type EditableShow = {
  id: string;
  city: string;
  venue: string | null;
  show_date: string;
  artist_id: string | null;
  tour_id: string | null;
  artists: { name: string } | null;
  tours: { name: string } | null;
};

function EditShowForm({
  show,
  onCancel,
  onSaved,
}: {
  show: EditableShow;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [artist, setArtist] = useState(show.artists?.name ?? "");
  const [tour, setTour] = useState(show.tours?.name ?? "");
  const [city, setCity] = useState(show.city);
  const [date, setDate] = useState(show.show_date);
  const [venue, setVenue] = useState(show.venue ?? "");
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Sessão expirada");

      let artistId = show.artist_id;
      if (artist.trim() && artist.trim() !== (show.artists?.name ?? "")) {
        const { data: existing } = await supabase
          .from("artists")
          .select("id")
          .eq("name", artist.trim())
          .maybeSingle();
        if (existing) {
          artistId = existing.id;
        } else {
          const { data: created, error: artistError } = await supabase
            .from("artists")
            .insert({ name: artist.trim(), user_id: userId })
            .select("id")
            .single();
          if (artistError) throw new Error(artistError.message);
          artistId = created.id;
        }
      }

      let tourId = show.tour_id;
      const tourName = tour.trim();
      if (tourName !== (show.tours?.name ?? "")) {
        if (!tourName) {
          tourId = null;
        } else if (tourId) {
          const { error: tourError } = await supabase
            .from("tours")
            .update({ name: tourName })
            .eq("id", tourId);
          if (tourError) throw new Error(tourError.message);
        } else {
          if (!artistId) throw new Error("Informe o artista para criar a tour");
          const { data: createdTour, error: tourError } = await supabase
            .from("tours")
            .insert({ name: tourName, artist_id: artistId, user_id: userId })
            .select("id")
            .single();
          if (tourError) throw new Error(tourError.message);
          tourId = createdTour.id;
        }
      }

      const { error: updateError } = await supabase
        .from("shows")
        .update({
          artist_id: artistId,
          tour_id: tourId,
          city,
          show_date: date,
          venue: venue || null,
        })
        .eq("id", show.id);
      if (updateError) throw new Error(updateError.message);
    },
    onSuccess: onSaved,
    onError: (e: Error) => setError(e.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        save.mutate();
      }}
      className="mt-6 grid grid-cols-1 gap-4 border border-line p-5 sm:grid-cols-2 lg:grid-cols-5"
    >
      <EditField label="Artista" value={artist} onChange={setArtist} required />
      <EditField label="Tour (opcional)" value={tour} onChange={setTour} />
      <EditField label="Cidade" value={city} onChange={setCity} required />
      <EditField label="Data" value={date} onChange={setDate} type="date" required />
      <EditField label="Local" value={venue} onChange={setVenue} />
      <div className="sm:col-span-2 lg:col-span-5">
        {error ? <p className="mb-2 font-mono text-[11px] text-destructive">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={save.isPending}
            className="bg-signal px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-signal-foreground disabled:opacity-50"
          >
            Salvar alterações
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="border border-line px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-accent"
          >
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="label-mono">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full border border-line bg-background px-3 py-2 text-sm outline-none focus:border-signal"
      />
    </label>
  );
}
