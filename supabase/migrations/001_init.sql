-- AirTag Assistant - Supabase schema
-- IMPORTANT:
-- - Update the vector dimension (384) to match your EMBED_DIM env var + embedding model output.
-- - If you change 384, update BOTH the table column type and the RPC function signature.

create extension if not exists vector;

-- gen_random_uuid() requires pgcrypto in many Postgres/Supabase setups
create extension if not exists pgcrypto;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  title text not null,
  url text null,
  chunk_id int not null,
  content text not null,
  embedding vector(384) not null,
  created_at timestamptz not null default now()
);

-- Avoid duplicates during ingest
do $$
begin
  alter table public.documents
    add constraint documents_source_chunk_unique unique (source, chunk_id);
exception
  when duplicate_object then
    null;
end $$;

-- Helpful supporting index (Postgres will typically create one for the constraint, but keep this explicit for clarity)
create index if not exists documents_source_chunk_idx
on public.documents (source, chunk_id);

-- For vector similarity search (choose one depending on your Supabase plan/pgvector version)
-- Option A: ivfflat (requires analyze + list count tuning; good for larger datasets)
-- create index if not exists documents_embedding_ivfflat
-- on public.documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Option B: hnsw (if available; often better out-of-the-box)
-- create index if not exists documents_embedding_hnsw
-- on public.documents using hnsw (embedding vector_cosine_ops);

-- RPC: vector similarity search
create or replace function public.match_documents(
  query_embedding vector(384),
  match_count int,
  min_score float
)
returns table (
  id uuid,
  title text,
  url text,
  chunk_id int,
  content text,
  similarity float
)
language sql
stable
as $$
  select
    d.id,
    d.title,
    d.url,
    d.chunk_id,
    d.content,
    (1 - (d.embedding <=> query_embedding)) as similarity
  from public.documents d
  where (1 - (d.embedding <=> query_embedding)) >= min_score
  order by d.embedding <=> query_embedding asc
  limit match_count;
$$;

-- Recommended for anon runtime read via RPC:
-- grant execute on function public.match_documents(vector(384), int, float) to anon;
-- grant select on public.documents to anon; -- optional if you only use RPC


