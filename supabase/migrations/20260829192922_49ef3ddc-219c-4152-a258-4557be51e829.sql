ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS is_reimbursement boolean NOT NULL DEFAULT false;

UPDATE public.documents d
SET is_reimbursement = true
FROM public.document_types t
WHERE t.id::text = d.doc_type AND t.reimbursable = true;