# AirTag Assistant (RAG Demo)

Production-quality, deployable demo chatbot that answers **only** about Apple AirTags / Find My item tracking using RAG:

- **Vector store**: Supabase Postgres + pgvector
- **LLM + Embeddings**: Cloudflare Workers AI (configurable via env)
- **Frontend**: Next.js (App Router, TypeScript)
- **Citations**: Document titles + chunk IDs (and URLs when present)
- **Refusals**: Out-of-scope queries + unsafe covert tracking/stalking

## Architecture

- `app/api/chat/route.ts`: API endpoint (guardrails → retrieval → prompt → generate)
- `lib/providers/cloudflare/*`: Cloudflare Workers AI clients (chat + embeddings)
- `lib/vectorstore/*`: Supabase client + RPC calls
- `lib/rag/*`: guardrails, chunking, retriever (vector + lexical fallback), prompting, pipeline
- `data/airtags/*.md`: small local knowledge base used for ingest and lexical fallback

Interfaces for forward-compat:

- `EmbeddingsProvider`, `ChatProvider`, `Retriever`, `RagPipeline` in `lib/types.ts`

## Setup (local)

### 1) Install

```bash
cd airtag-assistant
npm install
```

### 2) Create Supabase schema

Copy/paste `supabase/migrations/001_init.sql` into the Supabase SQL editor and run it.

**Important: EMBED_DIM**

- The migration uses `vector(384)` by default.
- If you change `EMBED_DIM`, you **must** update the SQL types in:
  - `documents.embedding vector(EMBED_DIM)`
  - `match_documents(query_embedding vector(EMBED_DIM), ...)`

### 3) Configure environment

Create a `.env.local` (for Next.js) and export the same vars for scripts.

Required env vars:

- `CF_ACCOUNT_ID`
- `CF_API_TOKEN`
- `CF_CHAT_MODEL` (default `@cf/meta/llama-3.1-8b-instruct`)
- `CF_EMBED_MODEL` (default `@cf/baai/bge-small-en-v1.5`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (ingest only)
- `SUPABASE_ANON_KEY` (runtime read)
- `RAG_TOP_K` (default 5)
- `RAG_MIN_SCORE` (default 0.2)
- `EMBED_DIM` (default 384)

### 4) Ingest the KB

```bash
npm run ingest
```

### 5) Smoke test (env + Supabase + RPC)

```bash
npm run smoke
```

### 6) Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel: **New Project → Import**.
3. Set Framework: Next.js (auto-detected).
4. Add the same env vars from above in **Project Settings → Environment Variables**.
5. Deploy.

## Supabase indexing notes

This demo includes commented index options in `supabase/migrations/001_init.sql`:

- **ivfflat**: requires tuning `lists` and works best with `ANALYZE`.
- **hnsw**: often best if your Supabase/pgvector supports it.

Start without an index for tiny demos, then add one when scaling.

## Troubleshooting

- **Embedding dim mismatch**: If ingest errors with “dim mismatch”, ensure `EMBED_DIM` matches the actual embedding model output and your SQL `vector(N)` dimension.
- **Missing pgvector**: Ensure the migration ran `create extension if not exists vector;`.
- **Invalid CF token/account**: `CF_API_TOKEN` must have access to Workers AI; verify `CF_ACCOUNT_ID` and token permissions.
- **RPC missing**: Re-run the migration or ensure `match_documents` exists and you granted execute if using anon.

## Sample questions

- “How do I pair an AirTag with my iPhone?”
- “What is Precision Finding and what devices support it?”
- “How do I replace the AirTag battery?”
- “Are AirTags water-resistant?”
- “How does Lost Mode work?”
- “What anti-stalking protections exist?”

## Future features (intentionally easy to add)

- Conversation memory + chat history (store messages in Supabase)
- Streaming responses (Next.js streaming + Workers AI stream)
- Feedback (thumbs up/down) + analytics
- Admin upload page for new docs + re-ingest
- Multi-tenant + auth (Supabase Auth, row-level security)


