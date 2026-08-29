import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getPublicShow = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ token: z.string().min(4) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: show, error } = await supabaseAdmin
      .from("shows")
      .select("id, city, venue, show_date, artist_id, artists(name)")
      .eq("public_token", data.token)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!show) return null;

    const { data: cast } = await supabaseAdmin
      .from("cast_members")
      .select("id, name, role")
      .eq("show_id", show.id)
      .order("name");

    return {
      show: {
        id: show.id as string,
        city: show.city as string,
        venue: (show.venue as string | null) ?? null,
        show_date: show.show_date as string,
        artist: (show.artists as { name: string } | null)?.name ?? null,
      },
      cast: (cast ?? []) as { id: string; name: string; role: string }[],
    };
  });

export const submitDocument = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string().min(4),
        castMemberId: z.string().uuid(),
        docType: z.enum(["passagem", "hotel", "nota"]),
        filePath: z.string().min(3),
        fileName: z.string().max(200).optional(),
        note: z.string().max(500).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: show, error } = await supabaseAdmin
      .from("shows")
      .select("id, user_id")
      .eq("public_token", data.token)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!show) throw new Error("Link inválido");

    const { data: member } = await supabaseAdmin
      .from("cast_members")
      .select("id")
      .eq("id", data.castMemberId)
      .eq("show_id", show.id)
      .maybeSingle();

    if (!member) throw new Error("Pessoa não pertence a este show");
    if (!data.filePath.startsWith(`${show.id}/`)) throw new Error("Arquivo inválido");

    const { error: insertError } = await supabaseAdmin.from("documents").insert({
      user_id: show.user_id,
      show_id: show.id,
      cast_member_id: data.castMemberId,
      doc_type: data.docType,
      file_path: data.filePath,
      file_name: data.fileName ?? null,
      note: data.note ?? null,
    });

    if (insertError) throw new Error(insertError.message);
    return { ok: true };
  });
