CREATE TABLE public.cast_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cast_roles TO authenticated;
GRANT ALL ON public.cast_roles TO service_role;
ALTER TABLE public.cast_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages cast roles" ON public.cast_roles FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.document_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  reimbursable boolean NOT NULL DEFAULT false,
  required boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_types TO authenticated;
GRANT ALL ON public.document_types TO service_role;
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages document types" ON public.document_types FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.documents ADD COLUMN amount numeric(12,2);

-- Seed defaults for every existing user that already has data
INSERT INTO public.cast_roles (user_id, name, position)
SELECT u.id, v.name, v.position
FROM auth.users u
CROSS JOIN (VALUES ('Integrante', 0), ('Produção', 1), ('Equipe técnica', 2)) AS v(name, position)
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO public.document_types (user_id, name, reimbursable, required, position)
SELECT u.id, v.name, v.reimbursable, v.required, v.position
FROM auth.users u
CROSS JOIN (VALUES
  ('Passagem', false, true, 0),
  ('Hotel/Voucher', false, true, 1),
  ('Nota fiscal', true, true, 2)
) AS v(name, reimbursable, required, position)
ON CONFLICT (user_id, name) DO NOTHING;

-- Point existing rows at the new lists (columns store the list row id)
UPDATE public.cast_members m
SET role = r.id::text
FROM public.cast_roles r
WHERE r.user_id = m.user_id
  AND r.name = CASE m.role
    WHEN 'integrante' THEN 'Integrante'
    WHEN 'producao' THEN 'Produção'
    WHEN 'tecnica' THEN 'Equipe técnica'
    ELSE NULL END;

UPDATE public.documents d
SET doc_type = t.id::text
FROM public.document_types t
WHERE t.user_id = d.user_id
  AND t.name = CASE d.doc_type
    WHEN 'passagem' THEN 'Passagem'
    WHEN 'hotel' THEN 'Hotel/Voucher'
    WHEN 'nota' THEN 'Nota fiscal'
    ELSE NULL END;