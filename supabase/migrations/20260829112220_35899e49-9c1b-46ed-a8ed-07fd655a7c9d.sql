
CREATE TABLE public.artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artists TO authenticated;
GRANT ALL ON public.artists TO service_role;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own artists" ON public.artists FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  artist_id uuid NOT NULL REFERENCES public.artists ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tours TO authenticated;
GRANT ALL ON public.tours TO service_role;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tours" ON public.tours FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  tour_id uuid REFERENCES public.tours ON DELETE SET NULL,
  artist_id uuid REFERENCES public.artists ON DELETE SET NULL,
  city text NOT NULL,
  show_date date NOT NULL,
  venue text,
  public_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(9), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shows TO authenticated;
GRANT ALL ON public.shows TO service_role;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own shows" ON public.shows FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.cast_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  show_id uuid NOT NULL REFERENCES public.shows ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'integrante',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cast_members TO authenticated;
GRANT ALL ON public.cast_members TO service_role;
ALTER TABLE public.cast_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cast" ON public.cast_members FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  show_id uuid NOT NULL REFERENCES public.shows ON DELETE CASCADE,
  cast_member_id uuid NOT NULL REFERENCES public.cast_members ON DELETE CASCADE,
  doc_type text NOT NULL,
  file_path text NOT NULL,
  file_name text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own documents" ON public.documents FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX ON public.documents (show_id);
CREATE INDEX ON public.cast_members (show_id);

CREATE POLICY "read documentos when signed in" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documentos');
CREATE POLICY "anyone can upload documentos" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'documentos');
