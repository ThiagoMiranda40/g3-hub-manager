export const DOC_TYPES = [
  { value: "passagem", label: "Passagem" },
  { value: "hotel", label: "Hotel / Voucher" },
  { value: "nota", label: "Nota fiscal" },
] as const;

export const CAST_ROLES = [
  { value: "integrante", label: "Integrante" },
  { value: "producao", label: "Produção" },
  { value: "tecnica", label: "Equipe técnica" },
] as const;

export function docTypeLabel(value: string) {
  return DOC_TYPES.find((d) => d.value === value)?.label ?? value;
}

export function roleLabel(value: string) {
  return CAST_ROLES.find((r) => r.value === value)?.label ?? value;
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatShowDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d);
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).toUpperCase();
}

export function formatWeekday(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d);
  return dt.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").toUpperCase();
}
