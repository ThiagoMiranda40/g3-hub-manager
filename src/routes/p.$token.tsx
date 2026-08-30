import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPublicShow, submitDocument } from "@/lib/public-show.functions";
import { ALLOWED_EXTENSIONS, MAX_UPLOAD_BYTES } from "@/lib/g3";

export const Route = createFileRoute("/p/$token")({
  head: () => ({
    meta: [
      { title: "Enviar documento — G3 Hub Manager" },
      {
        name: "description",
        content:
          "Envie sua passagem, voucher de hotel ou nota fiscal para a produção do show. Sem cadastro, sem login.",
      },
      { property: "og:title", content: "Enviar documento — G3 Hub Manager" },
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
  const [docTypeId, setDocTypeId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [isReimbursement, setIsReimbursement] = useState(false);

  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["public-show", token],
    queryFn: () => fetchShow({ data: { token } }),
  });

  const docTypes = data?.docTypes ?? [];
  const selectedType = docTypes.find((t) => t.id === docTypeId) ?? null;

  useEffect(() => {
    if (!docTypeId && docTypes[0]) setDocTypeId(docTypes[0].id);
  }, [docTypeId, docTypes]);

  useEffect(() => {
    if (selectedType) setIsReimbursement(selectedType.reimbursable);
  }, [selectedType?.id]);


  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const upload = useMutation({
    mutationFn: async () => {
      if (!data || !file) throw new Error("Selecione um arquivo");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        throw new Error("Formato não aceito. Envie uma imagem (JPG, PNG, WEBP) ou PDF.");
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error("Arquivo acima de 20 MB. Envie um arquivo menor.");
      }

      const path = `${data.show.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("documentos").upload(path, file);
      if (upErr) throw new Error(upErr.message);

      const parsedAmount = Number(amount.replace(/\./g, "").replace(",", "."));
      await send({
        data: {
          token,
          castMemberId: memberId,
          docTypeId,
          filePath: path,
          fileName: file.name,
          note: note || undefined,
          isReimbursement,
          amount:
            isReimbursement && amount.trim() && Number.isFinite(parsedAmount)
              ? parsedAmount
              : undefined,
        },
      });
    },

    onSuccess: () => {
      const person = data?.cast.find((c) => c.id === memberId)?.name ?? "";
      setDone(`${selectedType?.name ?? "Documento"} de ${person} recebido.`);
      setFile(null);
      setNote("");
      setAmount("");
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
                <span className="label-mono ml-auto">{m.role}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className="label-mono">2 · Tipo de documento</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {docTypes.length === 0 ? (
              <p className="font-mono text-[11px] text-muted-foreground">
                A produção ainda não configurou os tipos de documento.
              </p>
            ) : null}
            {docTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setDocTypeId(t.id)}
                className={
                  docTypeId === t.id
                    ? "bg-foreground px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-background"
                    : "border border-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
                }
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label-mono">3 · Foto ou arquivo</span>
          <label
            className={
              file
                ? "mt-2 grid cursor-pointer place-items-center border-2 border-ok bg-ok/10 px-4 py-6 text-center"
                : "mt-2 grid cursor-pointer place-items-center border border-dashed border-line px-4 py-8 text-center"
            }
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(e) => {
                setError(null);
                setFile(e.target.files?.[0] ?? null);
              }}
            />
            {preview ? (
              <img
                src={preview}
                alt="Pré-visualização do documento selecionado"
                className="mb-3 max-h-40 w-auto border border-line object-contain"
              />
            ) : null}
            <span
              className={
                file
                  ? "flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-ok"
                  : "font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground"
              }
            >
              {file ? (
                <>
                  <span className="grid size-5 place-items-center border border-ok text-[11px]">✓</span>
                  <span className="max-w-52 truncate normal-case tracking-normal">{file.name}</span>
                </>
              ) : (
                "Tocar para anexar"
              )}
            </span>
            <span className="label-mono mt-1">
              {file ? "Arquivo selecionado · tocar para trocar" : "JPG, PNG, WEBP ou PDF · até 20 MB"}
            </span>
          </label>
        </div>

        <label className="flex cursor-pointer items-start gap-3 border border-line px-3 py-3">
          <input
            type="checkbox"
            checked={isReimbursement}
            onChange={(e) => setIsReimbursement(e.target.checked)}
            className="mt-0.5 size-4 accent-[var(--signal,currentColor)]"
          />
          <span className="leading-tight">
            <span className="block text-sm font-medium">Este documento é para reembolso?</span>
            <span className="label-mono mt-0.5 block normal-case tracking-normal text-muted-foreground">
              Vem pré-marcado conforme o tipo escolhido, mas você pode alterar.
            </span>
          </span>
        </label>

        {isReimbursement ? (
          <label className="block">

            <span className="label-mono">Valor (R$) — opcional</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex.: 249,90"
              className="mt-1.5 w-full border border-line bg-background px-3 py-2 text-sm outline-none focus:border-signal"
            />
            <span className="label-mono mt-1 block normal-case tracking-normal text-muted-foreground">
              Valor informado por você, sem conferência automática.
            </span>
          </label>
        ) : null}

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
          disabled={upload.isPending || !memberId || !file || !docTypeId}
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
