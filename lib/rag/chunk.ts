import { normalizeWhitespace } from "@/lib/utils/text";

export type Chunk = {
  chunk_id: number;
  content: string;
};

/**
 * Simple, deterministic chunker: splits on paragraphs and merges into ~maxChars windows.
 * Good enough for a small demo KB; replace with token-aware chunker later if needed.
 */
export function chunkMarkdown(md: string, opts?: { maxChars?: number; overlapChars?: number }): Chunk[] {
  const maxChars = opts?.maxChars ?? 900;
  const overlapChars = opts?.overlapChars ?? 120;

  const paras = md
    .split(/\n{2,}/g)
    .map((p) => normalizeWhitespace(p))
    .filter((p) => p.length > 0);

  const chunks: string[] = [];
  let buf = "";

  for (const p of paras) {
    if (!buf) {
      buf = p;
      continue;
    }
    if ((buf + "\n\n" + p).length <= maxChars) {
      buf += "\n\n" + p;
    } else {
      chunks.push(buf);
      // overlap tail
      const tail = buf.slice(Math.max(0, buf.length - overlapChars));
      buf = normalizeWhitespace(tail + "\n\n" + p);
    }
  }
  if (buf) chunks.push(buf);

  return chunks.map((content, i) => ({ chunk_id: i + 1, content }));
}


