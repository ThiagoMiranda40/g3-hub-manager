import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_CAST_ROLES,
  DEFAULT_DOCUMENT_TYPES,
  type CastRole,
  type DocumentType,
} from "@/lib/g3";

export const catalogQueryKey = ["catalog"];

async function fetchCatalog() {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { roles: [] as CastRole[], docTypes: [] as DocumentType[] };

  let [{ data: roles }, { data: docTypes }] = await Promise.all([
    supabase.from("cast_roles").select("id, name, position").order("position").order("name"),
    supabase
      .from("document_types")
      .select("id, name, reimbursable, required, position")
      .order("position")
      .order("name"),
  ]);

  if (!roles || roles.length === 0) {
    await supabase
      .from("cast_roles")
      .insert(DEFAULT_CAST_ROLES.map((r) => ({ ...r, user_id: userId })));
    const { data } = await supabase
      .from("cast_roles")
      .select("id, name, position")
      .order("position");
    roles = data ?? [];
  }

  if (!docTypes || docTypes.length === 0) {
    await supabase
      .from("document_types")
      .insert(DEFAULT_DOCUMENT_TYPES.map((t) => ({ ...t, user_id: userId })));
    const { data } = await supabase
      .from("document_types")
      .select("id, name, reimbursable, required, position")
      .order("position");
    docTypes = data ?? [];
  }

  return {
    roles: (roles ?? []) as CastRole[],
    docTypes: (docTypes ?? []) as DocumentType[],
  };
}

export function useCatalog(enabled: boolean) {
  const query = useQuery({ queryKey: catalogQueryKey, enabled, queryFn: fetchCatalog });
  return {
    roles: query.data?.roles ?? [],
    docTypes: query.data?.docTypes ?? [],
    isLoading: query.isLoading,
  };
}
