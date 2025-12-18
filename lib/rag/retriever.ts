import fs from "node:fs/promises";
import path from "node:path";
import type { EmbeddingsProvider, Retriever, RetrievedChunk } from "@/lib/types";
import { clamp01 } from "@/lib/utils/score";
import { tokenizeForLexical } from "@/lib/utils/text";
import { matchDocuments } from "@/lib/vectorstore/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export type RagRetrieverConfig = {
  topK: number;
  minScore: number;
  kbDirAbs: string;
};

export class RagRetriever implements Retriever {
  constructor(
    private readonly cfg: RagRetrieverConfig,
    private readonly deps: { embeddings: EmbeddingsProvider; supabase: SupabaseClient }
  ) {}

  async retrieve(query: string): Promise<RetrievedChunk[]> {
    const qVec = await this.deps.embeddings.embed(query);
    const rows = await matchDocuments({
      client: this.deps.supabase,
      queryEmbedding: qVec,
      matchCount: this.cfg.topK,
      minScore: this.cfg.minScore
    });

    const vectorChunks: RetrievedChunk[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      chunk_id: r.chunk_id,
      content: r.content,
      similarity: r.similarity,
      source: "vector"
    }));

    if (vectorChunks.length > 0) return vectorChunks;

    // Lexical fallback: keyword match over local KB markdown files.
    const lexical = await lexicalFallback(query, this.cfg.kbDirAbs, this.cfg.topK);
    return lexical;
  }
}

async function lexicalFallback(query: string, kbDirAbs: string, topK: number): Promise<RetrievedChunk[]> {
  const files = await fs.readdir(kbDirAbs);
  const mdFiles = files.filter((f) => f.endsWith(".md"));
  const qTokens = new Set(tokenizeForLexical(query));
  if (qTokens.size === 0) return [];

  const scored: Array<{ file: string; title: string; content: string; score: number }> = [];
  for (const file of mdFiles) {
    const abs = path.join(kbDirAbs, file);
    const content = await fs.readFile(abs, "utf8");
    const title = extractTitle(content) ?? file.replace(/\.md$/i, "");
    const tokens = tokenizeForLexical(content);
    const freq = new Map<string, number>();
    for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);

    let hits = 0;
    for (const t of qTokens) hits += Math.min(3, freq.get(t) ?? 0);
    const denom = Math.max(8, qTokens.size * 2);
    const score = clamp01(hits / denom);
    if (score > 0) scored.push({ file, title, content, score });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);

  // Convert whole doc into "chunk 1" for lexical fallback; still cite title+chunk_id.
  return top.map((t, i) => ({
    id: `lexical:${t.file}:${i + 1}`,
    title: t.title,
    url: extractFirstReferenceUrl(t.content),
    chunk_id: 1,
    content: t.content,
    similarity: t.score,
    source: "lexical"
  }));
}

function extractTitle(md: string): string | null {
  const m = md.match(/^#\s+(.+)\s*$/m);
  return m?.[1]?.trim() ?? null;
}

function extractFirstReferenceUrl(md: string): string | null {
  const m = md.match(/References:\s*\n(?:-|\*)\s*(https?:\/\/\S+)/i) ?? md.match(/(https?:\/\/support\.apple\.com\/\S+)/i);
  return m?.[1] ?? null;
}


