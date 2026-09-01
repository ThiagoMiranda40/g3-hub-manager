import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useCatalog, catalogQueryKey } from "@/hooks/useCatalog";
import { AppShell } from "@/components/AppShell";
import { ConfirmButton } from "@/components/ConfirmButton";

import type { CastRole, DocumentType } from "@/lib/g3";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Configurações — G3 Hub Manager" },
      {
        name: "description",
        content:
          "Gerencie as funções do elenco e os tipos de documento exigidos na produção de turnê.",
      },
      { property: "og:title", content: "Configurações — G3 Hub Manager" },
      {
        property: "og:description",
        content: "Funções do elenco e tipos de documento configuráveis do G3 Hub Manager.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const router = useRouter();
  const { session, loading } = useSession();
  const qc = useQueryClient();
  const { roles, docTypes } = useCatalog(!!session);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) router.navigate({ to: "/auth" });
  }, [loading, session, router]);

  const { data: usage } = useQuery({
    queryKey: ["catalog-usage"],
    enabled: !!session,
    queryFn: async () => {
      const [{ data: cast }, { data: docs }] = await Promise.all([
        supabase.from("cast_members").select("role"),
        supabase.from("documents").select("doc_type"),
      ]);
      return {
        roles: (cast ?? []).map((c) => c.role),
        docTypes: (docs ?? []).map((d) => d.doc_type),
      };
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: catalogQueryKey });
    qc.invalidateQueries({ queryKey: ["catalog-usage"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const save = useMutation({
    mutationFn: async (fn: () => PromiseLike<{ error: { message: string } | null }>) => {
      const { error } = await fn();
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setError(null);
      refresh();
    },
    onError: (e: Error) => setError(e.message),
  });

  async function withUserId<T extends Record<string, unknown>>(values: T) {
    const { data } = await supabase.auth.getUser();
    return { ...values, user_id: data.user?.id as string };
  }

  if (loading || !session) return null;

  const roleUsed = (id: string) => (usage?.roles ?? []).filter((r) => r === id).length;
  const typeUsed = (id: string) => (usage?.docTypes ?? []).filter((t) => t === id).length;

  return (
    <AppShell email={session.user.email}>
      <p className="label-mono">(e) Configurações</p>
      <h1 className="mt-3 text-4xl leading-none sm:text-5xl">Listas do sistema</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Funções do elenco e tipos de documento são livres. Tipos marcados como obrigatórios são
        os únicos que contam como pendência de cada pessoa.
      </p>

      {error ? (
        <p className="mt-4 border border-destructive px-3 py-2 font-mono text-[11px] text-destructive">
          {error}
        </p>
      ) : null}

      <section className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <div className="label-mono mb-4">Funções do elenco</div>
          <div className="border border-line">
            {roles.length === 0 ? (
              <p className="px-5 py-8 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Nenhuma função cadastrada
              </p>
            ) : null}
            {roles.map((role) => (
              <RoleRow
                key={role.id}
                role={role}
                used={roleUsed(role.id)}
                onRename={(name) =>
                  save.mutate(() =>
                    supabase.from("cast_roles").update({ name }).eq("id", role.id),
                  )
                }
                onDelete={() =>
                  save.mutate(() =>
                    supabase.from("cast_roles").delete().eq("id", role.id),
                  )
                }
              />
            ))}
            <CreateRow
              placeholder="Nova função"
              onCreate={async (name) => {
                const values = await withUserId({ name, position: roles.length });
                save.mutate(() => supabase.from("cast_roles").insert(values));
              }}
            />
          </div>
        </div>

        <div>
          <div className="label-mono mb-4">Tipos de documento</div>
          <div className="border border-line">
            {docTypes.length === 0 ? (
              <p className="px-5 py-8 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Nenhum tipo cadastrado
              </p>
            ) : null}
            {docTypes.map((type) => (
              <TypeRow
                key={type.id}
                type={type}
                used={typeUsed(type.id)}
                onUpdate={(values) =>
                  save.mutate(() =>
                    supabase.from("document_types").update(values).eq("id", type.id),
                  )
                }
                onDelete={() =>
                  save.mutate(() =>
                    supabase.from("document_types").delete().eq("id", type.id),
                  )
                }
              />
            ))}
            <CreateRow
              placeholder="Novo tipo de documento"
              onCreate={async (name) => {
                const values = await withUserId({
                  name,
                  position: docTypes.length,
                  reimbursable: false,
                  required: true,
                });
                save.mutate(() => supabase.from("document_types").insert(values));
              }}
            />
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function RoleRow({
  role,
  used,
  onRename,
  onDelete,
}: {
  role: CastRole;
  used: number;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(role.name);

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && name !== role.name && onRename(name.trim())}
        className="min-w-32 flex-1 border border-line bg-background px-3 py-2 text-sm outline-none focus:border-signal"
      />
      <DeleteButton
        used={used}
        blockedMessage={`${used} pessoa(s) usam esta função`}
        onDelete={onDelete}
      />
    </div>
  );
}

function TypeRow({
  type,
  used,
  onUpdate,
  onDelete,
}: {
  type: DocumentType;
  used: number;
  onUpdate: (values: Partial<DocumentType>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(type.name);

  return (
    <div className="border-b border-line px-4 py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && name !== type.name && onUpdate({ name: name.trim() })}
          className="min-w-32 flex-1 border border-line bg-background px-3 py-2 text-sm outline-none focus:border-signal"
        />
        <DeleteButton
          used={used}
          blockedMessage={`${used} documento(s) usam este tipo`}
          onDelete={onDelete}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-4">
        <Toggle
          label="Reembolsável?"
          checked={type.reimbursable}
          onChange={(v) => onUpdate({ reimbursable: v })}
        />
        <Toggle
          label="Obrigatório para todo o elenco?"
          checked={type.required}
          onChange={(v) => onUpdate({ required: v })}
        />
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5 accent-[var(--signal)]"
      />
      <span className="label-mono">{label}</span>
    </label>
  );
}

function DeleteButton({
  used,
  blockedMessage,
  onDelete,
}: {
  used: number;
  blockedMessage: string;
  onDelete: () => void;
}) {
  const [warn, setWarn] = useState(false);

  if (used > 0) {
    return (
      <div className="text-right">
        <button
          type="button"
          onClick={() => setWarn(true)}
          className="border border-line px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
        >
          Excluir
        </button>
        {warn ? (
          <p className="mt-1 font-mono text-[10px] text-destructive">
            Não é possível excluir: {blockedMessage}.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="text-right">
      <ConfirmButton
        onConfirm={onDelete}
        className="border border-line px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors hover:border-destructive hover:text-destructive"
        confirmClassName="border border-destructive bg-destructive/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-destructive"
      />
    </div>
  );
}


function CreateRow({
  placeholder,
  onCreate,
}: {
  placeholder: string;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onCreate(name.trim());
        setName("");
      }}
      className="flex flex-wrap items-center gap-3 border-t border-line bg-accent/30 px-4 py-3"
    >
      <input
        value={name}
        placeholder={placeholder}
        onChange={(e) => setName(e.target.value)}
        className="min-w-32 flex-1 border border-line bg-background px-3 py-2 text-sm outline-none focus:border-signal"
      />
      <button
        type="submit"
        className="bg-foreground px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-background"
      >
        Adicionar
      </button>
    </form>
  );
}
