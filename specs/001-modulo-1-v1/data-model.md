# Modelo de Dados — Módulo 1 V1: Hub Manager Tour

## 1. Visão Geral e Princípios de Modelagem

O modelo de dados do Hub Manager Tour segue o padrão relacional em **Terceira Forma Normal (3NF)** no PostgreSQL (Supabase), com integridade referencial estrita, chaves estrangeiras explícitas, constraints de unicidade (`UNIQUE`) para garantia atômica contra concorrência e Row Level Security (RLS) habilitado em 100% das tabelas.

### Problemas estruturais do protótipo resolvidos nesta versão:
1. **Pessoas e Elenco**: No protótipo, a tabela `cast_members` continha apenas `(show_id, name, role)`. A cada novo show, as mesmas pessoas eram redigitadas, impossibilitando manter contatos permanentes, histórico e vínculos de equipe. Agora, a entidade central é `people`, cadastrada uma única vez pelo administrador, com tabela associativa `person_artists` para definir se a pessoa atua com artistas específicos ou integra a "equipe geral". O elenco de um show referencia a pessoa permanente (`person_id`) ou permite membros pontuais daquela data.
2. **Exigência de Documentos**: No protótipo, `document_types` possuía `required boolean` global. No V1, a regra de negócio validada em produção exige que a obrigatoriedade seja individualizada por **pessoa + show + tipo de documento**. A tabela `show_requirements` materializa essa relação, permitindo prazo (`deadline_date`) e cancelamento de exigência sem apagar o tipo de documento.
3. **Rider Técnico Digital**: Introdução das entidades `artist_rider_template_items` (o catálogo padrão do artista) e `show_rider_items` (a instância do rider para um show específico, com status de confirmação pública da casa de show, nota de exceção e conferência física pós-show).

---

## 2. Diagrama de Relacionamento de Entidades (ERD)

```
auth.users (Administrador)
  │
  ├──► public.artists
  │      ├──► public.tours
  │      │      └──► public.shows ──┐
  │      │                          │
  │      └──► public.artist_rider_template_items (Catálogo padrão)
  │                                 │
  ├──► public.people                │
  │      ├──► public.person_artists │ (Vínculo Pessoa <-> Artista / Equipe Geral)
  │      │                          ▼
  │      └───────────────► public.cast_members (Elenco do Show)
  │                                 │
  │                                 ├──► public.show_requirements (Exigência individual)
  │                                 │
  │                                 └──► public.documents (Comprovantes / Anexos)
  │
  └───────────────────────────────► public.show_rider_items (Instância do Rider do Show)
```

---

## 3. Especificação Detalhada das Tabelas

### 3.1 `public.people` (Novo)
Armazena o cadastro único de integrantes e profissionais de produção sob a conta do administrador.

| Coluna | Tipo | Modificadores | Descrição |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Identificador único da pessoa |
| `user_id` | `uuid` | `NOT NULL REFERENCES auth.users ON DELETE CASCADE` | Administrador proprietário da conta |
| `name` | `text` | `NOT NULL` | Nome completo do integrante |
| `phone` | `text` | `NULL` | Telefone com DDD (ex: +55 11 99999-9999) |
| `email` | `text` | `NULL` | E-mail de contato |
| `default_role_id` | `uuid` | `NULL REFERENCES public.cast_roles ON DELETE SET NULL` | Função habitual (Músico, Técnico, etc.) |
| `notes` | `text` | `NULL` | Observações gerais (ex: tamanho de camiseta, restrições) |
| `created_at` | `timestamptz`| `NOT NULL DEFAULT now()` | Data de criação do registro |
| `updated_at` | `timestamptz`| `NOT NULL DEFAULT now()` | Data da última alteração |

**Constraints:**
- `UNIQUE(user_id, name)` — Impede nomes duplicados no catálogo do mesmo produtor.

---

### 3.2 `public.person_artists` (Novo)
Define a qual(is) artista(s) a pessoa está vinculada ou se integra a equipe geral (carregada para todos os shows do administrador).

| Coluna | Tipo | Modificadores | Descrição |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Identificador do vínculo |
| `user_id` | `uuid` | `NOT NULL REFERENCES auth.users ON DELETE CASCADE` | Administrador proprietário |
| `person_id` | `uuid` | `NOT NULL REFERENCES public.people ON DELETE CASCADE` | Pessoa vinculada |
| `artist_id` | `uuid` | `NULL REFERENCES public.artists ON DELETE CASCADE` | Artista vinculado (NULL se for equipe geral) |
| `is_general_crew` | `boolean`| `NOT NULL DEFAULT false` | True se a pessoa participa de todos os artistas |
| `created_at` | `timestamptz`| `NOT NULL DEFAULT now()` | Data de vinculação |

**Constraints:**
- `CHECK ((artist_id IS NOT NULL AND is_general_crew = false) OR (artist_id IS NULL AND is_general_crew = true))` — Garante consistência lógica: ou pertence a um artista específico, ou é equipe geral.
- `UNIQUE(user_id, person_id, artist_id)` — Impede vínculo duplicado para o mesmo artista.

---

### 3.3 `public.shows` (Atualização de Schema)
Representa a data de show da turnê. Mantém o `public_token` para envio de documentos e adiciona `rider_public_token` exclusivo para a casa de show.

| Coluna | Tipo | Modificadores | Descrição |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | ID do show |
| `user_id` | `uuid` | `NOT NULL REFERENCES auth.users ON DELETE CASCADE` | Administrador |
| `tour_id` | `uuid` | `NULL REFERENCES public.tours ON DELETE SET NULL` | Turnê associada |
| `artist_id` | `uuid` | `NULL REFERENCES public.artists ON DELETE SET NULL` | Artista principal |
| `city` | `text` | `NOT NULL` | Cidade da apresentação |
| `show_date` | `date` | `NOT NULL` | Data do show |
| `venue` | `text` | `NULL` | Casa de show, teatro ou praça |
| `public_token` | `text` | `NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(9), 'hex')` | Token público para envio de docs |
| `rider_public_token` | `text` | `NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(9), 'hex')` | Token público para confirmação de rider |
| `created_at` | `timestamptz`| `NOT NULL DEFAULT now()` | Data de criação |

---

### 3.4 `public.cast_members` (Evolução da tabela existente)
Representa a escala das pessoas presentes naquele show específico.

| Coluna | Tipo | Modificadores | Descrição |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | ID da escalação no show |
| `user_id` | `uuid` | `NOT NULL REFERENCES auth.users ON DELETE CASCADE` | Administrador |
| `show_id` | `uuid` | `NOT NULL REFERENCES public.shows ON DELETE CASCADE` | Show correspondente |
| `person_id` | `uuid` | `NULL REFERENCES public.people ON DELETE SET NULL` | Vínculo com cadastro central (NULL se avulso) |
| `name` | `text` | `NOT NULL` | Nome snapshot no show |
| `role` | `text` | `NOT NULL DEFAULT 'integrante'` | ID da função (`cast_roles.id`) ou texto descritivo |
| `created_at` | `timestamptz`| `NOT NULL DEFAULT now()` | Data da inclusão no elenco |

**Constraints:**
- `UNIQUE(show_id, person_id)` (quando `person_id IS NOT NULL`) — Impede a mesma pessoa escalada duas vezes no mesmo show.

---

### 3.5 `public.show_requirements` (Novo — Substitui regra global)
Materializa quais documentos são obrigatórios para quem em cada show específico.

| Coluna | Tipo | Modificadores | Descrição |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | ID da exigência |
| `user_id` | `uuid` | `NOT NULL REFERENCES auth.users ON DELETE CASCADE` | Administrador |
| `show_id` | `uuid` | `NOT NULL REFERENCES public.shows ON DELETE CASCADE` | Show |
| `cast_member_id`| `uuid` | `NOT NULL REFERENCES public.cast_members ON DELETE CASCADE` | Integrante escalado |
| `document_type_id`| `uuid` | `NOT NULL REFERENCES public.document_types ON DELETE CASCADE`| Tipo de documento exigido |
| `required` | `boolean`| `NOT NULL DEFAULT true` | Se é mandatório para a pessoa |
| `deadline_date`| `date` | `NULL` | Data limite de entrega |
| `created_at` | `timestamptz`| `NOT NULL DEFAULT now()` | Data de criação |

**Constraints:**
- `UNIQUE(show_id, cast_member_id, document_type_id)` — Uma pessoa só tem uma regra por tipo em cada show.

---

### 3.6 `public.documents` (Atualização de Schema)
Comprovantes enviados pela pessoa ou anexados pelo produtor.

| Coluna | Tipo | Modificadores | Descrição |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | ID do documento |
| `user_id` | `uuid` | `NOT NULL REFERENCES auth.users ON DELETE CASCADE` | Administrador |
| `show_id` | `uuid` | `NOT NULL REFERENCES public.shows ON DELETE CASCADE` | Show |
| `cast_member_id`| `uuid` | `NOT NULL REFERENCES public.cast_members ON DELETE CASCADE` | Integrante remetente |
| `doc_type` | `text` | `NOT NULL` | ID de `document_types` |
| `file_path` | `text` | `NOT NULL` | Caminho no Supabase Storage (`bucket: documentos`) |
| `file_name` | `text` | `NULL` | Nome original do arquivo enviado |
| `note` | `text` | `NULL` | Observações preenchidas no envio |
| `amount` | `numeric(12,2)`| `NULL` | Valor em moeda local para reembolso |
| `is_reimbursement`| `boolean`| `NOT NULL DEFAULT false` | Marcado pela pessoa no ato do envio |
| `extracted_data`| `jsonb` | `NULL` | Dados estruturados via IA (voo, hotel, etc. - stretch) |
| `created_at` | `timestamptz`| `NOT NULL DEFAULT now()` | Data de envio |

---

### 3.7 `public.artist_rider_template_items` (Novo)
Itens do catálogo de Rider Técnico padrão do Artista.

| Coluna | Tipo | Modificadores | Descrição |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | ID do item de rider padrão |
| `user_id` | `uuid` | `NOT NULL REFERENCES auth.users ON DELETE CASCADE` | Administrador |
| `artist_id` | `uuid` | `NOT NULL REFERENCES public.artists ON DELETE CASCADE` | Artista dono do rider |
| `category` | `text` | `NOT NULL` | Categoria (ex: 'backline', 'som', 'iluminacao', 'camarim', 'outros') |
| `item_name` | `text` | `NOT NULL` | Nome do item (ex: 'Amplificador de Contrabaixo') |
| `specification`| `text` | `NULL` | Especificação (ex: 'Ampeg SVT-CL com caixa 8x10"') |
| `quantity` | `integer`| `NOT NULL DEFAULT 1` | Quantidade demandada |
| `is_mandatory` | `boolean`| `NOT NULL DEFAULT true` | Se é item inegociável ou desejável |
| `position` | `integer`| `NOT NULL DEFAULT 0` | Ordem de exibição |
| `created_at` | `timestamptz`| `NOT NULL DEFAULT now()` | Data de inclusão |

---

### 3.8 `public.show_rider_items` (Novo)
Instância dos itens de Rider Técnico do Show específico com ciclo de confirmação pública da casa e conferência física.

| Coluna | Tipo | Modificadores | Descrição |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | ID do item no show |
| `user_id` | `uuid` | `NOT NULL REFERENCES auth.users ON DELETE CASCADE` | Administrador |
| `show_id` | `uuid` | `NOT NULL REFERENCES public.shows ON DELETE CASCADE` | Show |
| `template_item_id`| `uuid`| `NULL REFERENCES public.artist_rider_template_items ON DELETE SET NULL` | Item de origem |
| `category` | `text` | `NOT NULL` | Categoria do item |
| `item_name` | `text` | `NOT NULL` | Nome do item |
| `specification`| `text` | `NULL` | Especificação detalhada |
| `quantity` | `integer`| `NOT NULL DEFAULT 1` | Quantidade |
| `is_mandatory` | `boolean`| `NOT NULL DEFAULT true` | Se é mandatório |
| `position` | `integer`| `NOT NULL DEFAULT 0` | Ordenação |
| `status` | `text` | `NOT NULL DEFAULT 'pending'` | 'pending', 'confirmed', 'exception' |
| `exception_note`| `text` | `NULL` | Justificativa/alternativa enviada pela casa |
| `confirmed_by_venue_at`| `timestamptz`| `NULL` | Timestamp da confirmação pela casa |
| `physical_check`| `text` | `NOT NULL DEFAULT 'unchecked'` | 'unchecked', 'conformed', 'divergent' |
| `physical_divergence_note`| `text`| `NULL` | Nota da conferência presencial no dia |
| `created_at` | `timestamptz`| `NOT NULL DEFAULT now()` | Data de criação |

**Constraints:**
- `CHECK (status IN ('pending', 'confirmed', 'exception'))`
- `CHECK (physical_check IN ('unchecked', 'conformed', 'divergent'))`

---

## 4. Estratégia de Índices (Performance & Integridade)

```sql
-- Índices para buscas frequentes e chaves estrangeiras
CREATE INDEX idx_people_user_id ON public.people (user_id);
CREATE INDEX idx_person_artists_person ON public.person_artists (person_id);
CREATE INDEX idx_person_artists_artist ON public.person_artists (artist_id);
CREATE INDEX idx_person_artists_general ON public.person_artists (user_id) WHERE is_general_crew = true;

CREATE INDEX idx_shows_artist_id ON public.shows (artist_id);
CREATE INDEX idx_shows_rider_token ON public.shows (rider_public_token);
CREATE INDEX idx_shows_public_token ON public.shows (public_token);

CREATE INDEX idx_cast_members_show_person ON public.cast_members (show_id, person_id);
CREATE INDEX idx_show_requirements_show_member ON public.show_requirements (show_id, cast_member_id);

CREATE INDEX idx_rider_template_artist ON public.artist_rider_template_items (artist_id);
CREATE INDEX idx_show_rider_items_show ON public.show_rider_items (show_id);
```

---

## 5. Políticas de Segurança (Row Level Security - RLS)

Todas as tabelas possuem RLS ativado. O modelo garante:
1. **Administrador logado (`authenticated`)**: Acesso total apenas aos registros onde `user_id = auth.uid()`.
2. **Acesso anônimo com token de upload (`/p/$token`)**:
   - `SELECT` em `shows`, `cast_members` e `show_requirements` condicionado à validação do `public_token` via função segura RPC / Server Function.
   - `INSERT` em `documents` e upload no bucket `documentos` validando correspondência de `show_id` e token válido.
3. **Acesso anônimo com token de rider (`/r/$token`)**:
   - `SELECT` em `shows` e `show_rider_items` correspondentes ao `rider_public_token`.
   - `UPDATE` limitado nas colunas `status` e `exception_note` de `show_rider_items` para os itens daquele show com token válido, sem expor dados internos de cache ou financeiro.

---

## 6. Plano de Migração e Compatibilidade com Dados do Protótipo

A migration será executada de forma retrocompatível:
1. Criação das novas tabelas (`people`, `person_artists`, `show_requirements`, `artist_rider_template_items`, `show_rider_items`).
2. Adição da coluna `rider_public_token` em `shows` (gerando tokens hex para todos os shows existentes).
3. Adição da coluna `person_id` em `cast_members`.
4. **Seed/Backfill de Pessoas a partir do Elenco Legado**:
   - Agrupa nomes únicos de `cast_members` existentes por `user_id`.
   - Insere na tabela `people` cada nome único.
   - Atualiza `cast_members.person_id` apontando para o id recém-criado em `people`.
5. **Backfill de Exigências**:
   - Para shows já cadastrados, cria registros em `show_requirements` baseando-se nos `document_types` marcados como `required = true`, garantindo que nenhum progresso de show existente seja quebrado após o deploy.
