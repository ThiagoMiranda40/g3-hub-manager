export type CastRole = {
  id: string;
  name: string;
  position: number;
};

export type DocumentType = {
  id: string;
  name: string;
  reimbursable: boolean;
  required: boolean;
  position: number;
};

export const DEFAULT_CAST_ROLES = [
  { name: "Integrante", position: 0 },
  { name: "Produção", position: 1 },
  { name: "Equipe técnica", position: 2 },
];

export const DEFAULT_DOCUMENT_TYPES = [
  { name: "Passagem", reimbursable: false, required: true, position: 0 },
  { name: "Hotel/Voucher", reimbursable: false, required: true, position: 1 },
  { name: "Nota fiscal", reimbursable: true, required: true, position: 2 },
];

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "pdf"];
export const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export type ShowProgress = {
  hasRequirement: boolean;
  expected: number;
  received: number;
  pct: number;
  done: boolean;
  pendingPeople: number;
};

/** Única fonte de verdade do cálculo de pendência (prancheta e detalhe do show). */
export function computeShowProgress(
  members: { id: string }[],
  docs: { cast_member_id: string; doc_type: string }[],
  docTypes: { id: string; required: boolean }[],
): ShowProgress {
  const requiredTypes = docTypes.filter((t) => t.required);
  const hasRequirement = requiredTypes.length > 0 && members.length > 0;
  const expected = members.length * requiredTypes.length;
  const received = members.reduce(
    (total, member) =>
      total +
      requiredTypes.filter((t) =>
        docs.some((d) => d.cast_member_id === member.id && d.doc_type === t.id),
      ).length,
    0,
  );
  const capped = Math.min(received, expected);
  const pendingPeople = members.filter((m) =>
    requiredTypes.some((t) => !docs.some((d) => d.cast_member_id === m.id && d.doc_type === t.id)),
  ).length;

  return {
    hasRequirement,
    expected,
    received: capped,
    pct: expected > 0 ? Math.round((capped / expected) * 100) : 0,
    done: hasRequirement && capped >= expected,
    pendingPeople,
  };
}

export function labelFrom<T extends { id: string; name: string }>(

  list: T[],
  value: string | null | undefined,
) {
  if (!value) return "—";
  return list.find((i) => i.id === value)?.name ?? value;
}

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function parseDate(date: string) {
  const parts = date.split("-").map(Number);
  return new Date(parts[0] ?? 1970, (parts[1] ?? 1) - 1, parts[2] ?? 1);
}

export function formatShowDate(date: string) {
  const dt = parseDate(date);
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).toUpperCase();
}

export function formatWeekday(date: string) {
  const dt = parseDate(date);
  return dt.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").toUpperCase();
}
