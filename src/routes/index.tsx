import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/Skeleton";
import { computeShowProgress, formatShowDate, formatWeekday } from "@/lib/g3";
import { useCatalog } from "@/hooks/useCatalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prancheta de Turnê — G3 Hub Manager" },
      {
        name: "description",
        content:
          "Agenda de shows com status de documentos: veja num relance quem já enviou passagem, hotel e nota, e quem ainda falta.",
      },
      { property: "og:title", content: "Prancheta de Turnê — G3 Hub Manager" },
      {
        property: "og:description",
        content: "Agenda de shows com status de documentos da produção de turnê.",
      },
    ],
  }),
  component: Dashboard,
});

type ShowRow = {
  id: string;
  city: string;
  venue: string | null;
  show_date: string;
  artists: { name: string } | null;
};

function Dashboard() {
  const router = useRouter();
  const { session, loading } = useSession();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [artistFilter, setArtistFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "complete">("all");

  useEffect(() => {
    if (!loading && !session) router.navigate({ to: "/auth" });
  }, [loading, session, router]);

  const enabled = !!session;
  const { docTypes } = useCatalog(enabled);

  const { data } = useQuery({
    queryKey: ["dashboard"],
    enabled,
    queryFn: async () => {
      const [{ data: shows }, { data: cast }, { data: docs }] = await Promise.all([
        supabase
          .from("shows")
          .select("id, city, venue, show_date, artists(name)")
          .order("show_date"),
        supabase.from("cast_members").select("id, show_id"),
        supabase.from("documents").select("id, show_id, cast_member_id, doc_type"),
      ]);
      return {
        shows: (shows ?? []) as ShowRow[],
        cast: cast ?? [],
        docs: docs ?? [],
      };
    },
  });

  const shows = data?.shows ?? [];
  const stats = shows.map((show) => {
    const members = (data?.cast ?? []).filter((c) => c.show_id === show.id);
    const docs = (data?.docs ?? []).filter((d) => d.show_id === show.id);
    return { show, progress: computeShowProgress(members, docs, docTypes) };
  });

  const complete = stats.filter((s) => s.progress.done).length;
  const pending = stats.filter((s) => s.progress.hasRequirement && !s.progress.done).length;

  const artists = Array.from(
    new Map(stats.map((s) => [s.show.artists?.name ?? "", s.show.artists?.name ?? ""])).entries(),
  )
    .map(([, name]) => name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  const filteredStats = stats.filter(({ show, progress }) => {
    const text = `${show.city} ${show.venue ?? ""} ${show.artists?.name ?? ""}`.toLowerCase();
    const matchesSearch = text.includes(search.trim().toLowerCase());
    const matchesArtist = artistFilter === "all" || show.artists?.name === artistFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && progress.hasRequirement && !progress.done) ||
      (statusFilter === "complete" && progress.done);
    return matchesSearch && matchesArtist && matchesStatus;
  });


  if (loading || !session) return null;

  return (
    <AppShell email={session.user.email}>
      <section className="grid grid-cols-1 items-end gap-6 border-b border-line pb-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="label-mono">(a) Agenda de produção</p>
          <h1 className="mt-3 text-5xl leading-[0.92] sm:text-6xl">
            Prancheta
            <br />
            de Turnê
          </h1>
        </div>
        <div className="grid grid-cols-3 gap-px self-end border border-line bg-line lg:col-span-5">
          <div className="bg-background p-4">
            <div className="label-mono">Shows</div>
            <div className="mt-2 font-display text-3xl leading-none">{shows.length}</div>
          </div>
          <div className="bg-background p-4">
            <div className="label-mono text-signal">Pendentes</div>
            <div className="mt-2 font-display text-3xl leading-none">{pending}</div>
          </div>
          <div className="bg-background p-4">
            <div className="label-mono text-ok">Completos</div>
            <div className="mt-2 font-display text-3xl leading-none">{complete}</div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="label-mono">(b) Próximas datas</div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="bg-foreground px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-background transition-colors hover:bg-signal"
          >
            {open ? "Fechar" : "Novo show"}
          </button>
        </div>

        {open ? <NewShowForm onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["dashboard"] }); }} /> : null}

        <div className="mb-6 grid grid-cols-1 gap-4 border border-line p-4 sm:grid-cols-12">
          <div className="sm:col-span-5">
            <label className="label-mono block">Buscar</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cidade, show ou artista"
              className="mt-1.5 w-full border border-line bg-background px-3 py-2 text-sm outline-none focus:border-signal"
            />
          </div>
          <div className="sm:col-span-4">
            <label className="label-mono block">Artista</label>
            <select
              value={artistFilter}
              onChange={(e) => setArtistFilter(e.target.value)}
              className="mt-1.5 w-full border border-line bg-background px-3 py-2 text-sm outline-none focus:border-signal"
            >
              <option value="all">Todos</option>
              {artists.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className="label-mono block">Status</label>
            <div className="mt-1.5 flex">
              {(["all", "pending", "complete"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`flex-1 border px-2 py-2 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                    statusFilter === key
                      ? "border-foreground bg-foreground text-background"
                      : "border-line bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {key === "all" ? "Todos" : key === "pending" ? "Pendentes" : "Completos"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-line">
          {filteredStats.length === 0 ? (
            <p className="py-10 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {stats.length === 0 ? "Nenhum show cadastrado ainda" : "Nenhum show encontrado para os filtros selecionados"}
            </p>
          ) : null}

          {filteredStats.map(({ show, progress }) => {
            const { hasRequirement, expected, received, pct, done, totalDocs, peopleWithDocs, members } =
              progress;
            return (
              <Link
                key={show.id}
                to="/shows/$id"
                params={{ id: show.id }}
                className="group grid grid-cols-1 items-center gap-3 border-b border-line py-5 transition-colors hover:bg-accent/50 sm:grid-cols-12 sm:gap-6"
              >
                <div className="font-mono text-[11px] tracking-wider text-muted-foreground sm:col-span-2">
                  <div className="font-medium text-foreground">
                    {formatWeekday(show.show_date)} · {show.show_date.slice(8, 10)}
                  </div>
                  <div>{formatShowDate(show.show_date)}</div>
                </div>
                <div className="sm:col-span-4">
                  <div className="font-display text-2xl leading-none">
                    {show.artists?.name ?? "SEM ARTISTA"}
                  </div>
                  <div className="mt-1 font-mono text-[11px] uppercase text-muted-foreground">
                    {show.city}
                    {show.venue ? ` · ${show.venue}` : ""}
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <div className="mb-1.5 flex justify-between gap-2 font-mono text-[11px]">
                    <span className="text-muted-foreground">DOCUMENTOS</span>
                    <span
                      className={
                        !hasRequirement
                          ? "text-muted-foreground"
                          : done
                            ? "font-medium text-ok"
                            : "font-medium text-signal"
                      }
                    >
                      {hasRequirement
                        ? `${received}/${expected}`
                        : `${totalDocs} recebido${totalDocs === 1 ? "" : "s"}`}
                    </span>
                  </div>
                  <div className="h-[3px] bg-line">
                    {hasRequirement ? (
                      <div
                        className={done ? "h-full bg-ok" : "h-full bg-signal"}
                        style={{ width: `${pct}%` }}
                      />
                    ) : null}
                  </div>
                  {!hasRequirement ? (
                    <div className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {members} no elenco · {peopleWithDocs} com envio
                    </div>
                  ) : null}
                </div>
                <div className="sm:col-span-2">
                  {!hasRequirement ? (
                    <span className="border border-line px-2 py-1 font-mono text-[10px] uppercase leading-tight tracking-wider text-muted-foreground">
                      Sem exigência
                    </span>
                  ) : done ? (
                    <span className="border border-ok px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ok">
                      Completo
                    </span>
                  ) : (
                    <span className="bg-signal px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-signal-foreground">
                      Pendente
                    </span>
                  )}
                </div>


                <div className="hidden text-right sm:col-span-1 sm:block">
                  <span className="font-mono text-[11px] text-muted-foreground group-hover:text-foreground">
                    ABRIR →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

function NewShowForm({ onDone }: { onDone: () => void }) {
  const [artist, setArtist] = useState("");
  const [tour, setTour] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Sessão expirada");

      const { data: existing } = await supabase
        .from("artists")
        .select("id")
        .eq("name", artist)
        .maybeSingle();

      let artistId = existing?.id;
      if (!artistId) {
        const { data: created, error } = await supabase
          .from("artists")
          .insert({ name: artist, user_id: userId })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        artistId = created.id;
      }

      let tourId: string | null = null;
      if (tour.trim()) {
        const { data: createdTour, error } = await supabase
          .from("tours")
          .insert({ name: tour, artist_id: artistId, user_id: userId })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        tourId = createdTour.id;
      }

      const { error: showError } = await supabase.from("shows").insert({
        user_id: userId,
        artist_id: artistId,
        tour_id: tourId,
        city,
        show_date: date,
        venue: venue || null,
      });
      if (showError) throw new Error(showError.message);
    },
    onSuccess: onDone,
    onError: (e: Error) => setError(e.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        mutation.mutate();
      }}
      className="mb-6 grid grid-cols-1 gap-4 border border-line p-5 sm:grid-cols-2 lg:grid-cols-5"
    >
      <Field label="Artista" value={artist} onChange={setArtist} required />
      <Field label="Tour (opcional)" value={tour} onChange={setTour} />
      <Field label="Cidade" value={city} onChange={setCity} required />
      <Field label="Data" value={date} onChange={setDate} type="date" required />
      <Field label="Local" value={venue} onChange={setVenue} />
      <div className="sm:col-span-2 lg:col-span-5">
        {error ? <p className="mb-2 font-mono text-[11px] text-destructive">{error}</p> : null}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-signal px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-signal-foreground disabled:opacity-50"
        >
          Salvar show
        </button>
      </div>
    </form>
  );
}

function Field({
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
