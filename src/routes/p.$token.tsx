import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPublicShow, submitDocument } from "@/lib/public-show.functions";
import { DOC_TYPES, roleLabel } from "@/lib/g3";

export const Route = createFileRoute("/p/$token")({
  head: () => ({
    meta: [
      { title: "Enviar documento — G3 Hub" },
      {
        name: "description",
        content:
          "Envie sua passagem, voucher de hotel ou nota fiscal para a produção do show. Sem cadastro, sem login.",
      },
      { property: "og:title", content: "Enviar documento — G3 Hub" },
      {
        property: "og:description",
        content: "Envio de passagem, hotel ou nota fiscal para a produção do show.",
      },
    ],
  }),
  component: PublicUpload,
});

function PublicUpload() {
  const { token } = Route.useParams();
  const fetchShow = useServerFn(getPublicShow);
  const send = useServerFn(submitDocument);

  const [memberId, setMemberId] = useState("");
  const [docType, setDocType] = useState<string>("passagem");
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["public-show", token],
    queryFn: () => fetchShow({ data: { token } }),
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!data || !file) throw new Error("Selecione um arquivo");
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${data.show.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("documentos").upload(path, file);
      if (upErr) throw new Error(upErr.message);
      await send({
        data: {
          token,
          castMemberId: memberId,
          docType: docType as "passagem" | "hotel" | "nota",
          filePath: path,
          fileName: file.name,
          note: note || undefined,
        },
      });
    },
    onSuccess: () => {
      const person = data?.cast.find((c) => c.id === memberId)?.name ?? "";
      setDone(`${DOC_TYPES.find((d) => d.value === docType)?.label} de ${person} recebido.`);
      setFile(null);
      setNote("");
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  if (isLoading) {
    return <p className="p-8 font-mono text-[11px] uppercase tracking-[0.18em]">Carregando…</p>;
  }

  if (!data) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <h1 className="text-4xl">LINK INVÁLIDO</h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Peça um novo link para a produção
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-10">
      <p className="label-mono">Envio de documento · sem cadastro</p>
      <h1 className="mt-2 text-4xl leading-none">{data.show.artist ?? "SHOW"}</h1>
      <p className="mt-2 font-mono text-[11px] uppercase text-muted-foreground">
        {data.show.city}
        {data.show.venue ? ` · ${data.show.venue}` : ""} · {data.show.show_date}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          setDone(null);
          upload.mutate();
        }}
        className="mt-8 space-y-6 border border-line p-5"
      >
        <div>
          <span className="label-mono">1 · Quem está enviando?</span>
          <div className="mt-2 space-y-2">
            {data.cast.length === 0 ? (
              <p className="font-mono text-[11px] text-muted-foreground">
                A produção ainda não cadastrou o elenco deste show.
              </p>
            ) : null}
            {data.cast.map((m) => (
              <label
                key={m.id}
                className={
                  memberId === m.id
                    ? "flex cursor-pointer items-center gap-3 border-2 border-foreground px-3 py-3"
                    : "flex cursor-pointer items-center gap-3 border border-line px-3 py-3"
                }
              >
                <input
                  type="radio"
                  name="member"
                  className="sr-only"
                  checked={memberId === m.id}
                  onChange={() => setMemberId(m.id)}
                />
                <span className="text-sm font-medium">{m.name}</span>
                <span className="label-mono ml-auto">{roleLabel(m.role)}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className="label-mono">2 · Tipo de documento</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {DOC_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setDocType(t.value)}
                className={
                  docType === t.value
                    ? "bg-foreground px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-background"
                    : "border border-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label-mono">3 · Foto ou arquivo</span>
          <label className="mt-2 grid cursor-pointer place-items-center border border-dashed border-line px-4 py-8 text-center">
            <input
              type="file"
              accept="image/*,application/pdf"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              {file ? file.name : "Tocar para anexar"}
            </span>
            <span className="label-mono mt-1">JPG, PNG ou PDF · até 20 MB</span>
          </label>
        </div>

        <label className="block">
          <span className="label-mono">Observação (opcional)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex.: voo LA3271, chegada 14:20"
            className="mt-1.5 w-full border border-line bg-background px-3 py-2 text-sm outline-none focus:border-signal"
          />
        </label>

        {error ? <p className="font-mono text-[11px] text-destructive">{error}</p> : null}

        <button
          type="submit"
          disabled={upload.isPending || !memberId || !file}
          className="w-full bg-signal py-3.5 font-mono text-[12px] uppercase tracking-[0.2em] text-signal-foreground disabled:opacity-40"
        >
          {upload.isPending ? "Enviando…" : "Enviar documento"}
        </button>

        {done ? (
          <div className="flex items-start gap-3 border border-line px-4 py-3">
            <div className="grid size-6 shrink-0 place-items-center border border-ok font-mono text-[11px] text-ok">
              ✓
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium">Documento registrado</div>
              <div className="label-mono mt-0.5">{done}</div>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
