import type { EmbeddingsProvider } from "@/lib/types";
import { CloudflareClient } from "@/lib/providers/cloudflare/client";

export class CloudflareEmbeddingsProvider implements EmbeddingsProvider {
  constructor(
    private readonly client: CloudflareClient,
    private readonly model: string,
    private readonly expectedDim?: number
  ) {}

  async embed(input: string): Promise<number[]> {
    // Workers AI embeddings commonly accept `text` as an array.
    const result = await this.client.run<unknown>(this.model, { text: [input] });
    const vec = extractEmbedding(result);
    if (!Array.isArray(vec) || vec.length === 0) {
      const preview = safePreview(result);
      throw new Error(`Embeddings response missing embedding vector. Response preview: ${preview}`);
    }
    if (this.expectedDim && vec.length !== this.expectedDim) {
      throw new Error(`Embedding dim mismatch: got ${vec.length}, expected ${this.expectedDim}. Check EMBED_DIM / CF_EMBED_MODEL.`);
    }
    return vec;
  }
}

function extractEmbedding(result: unknown): number[] | null {
  // Known-ish shapes:
  // 1) { data: [ { embedding: number[] } ] }
  // 2) { data: [ number[] ] }
  // 3) { embedding: number[] }
  // 4) { data: number[] } (single embedding)
  if (!result || typeof result !== "object") return null;
  const r = result as Record<string, unknown>;

  const embedding = r.embedding;
  if (Array.isArray(embedding) && embedding.every((x) => typeof x === "number")) return embedding as number[];

  const data = r.data;
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0] as unknown;
    if (Array.isArray(first) && first.every((x) => typeof x === "number")) return first as number[];
    if (first && typeof first === "object") {
      const fe = (first as Record<string, unknown>).embedding;
      if (Array.isArray(fe) && fe.every((x) => typeof x === "number")) return fe as number[];
    }
  }

  if (Array.isArray(data) && (data as unknown[]).every((x) => typeof x === "number")) return data as number[];

  return null;
}

function safePreview(x: unknown): string {
  try {
    const s = JSON.stringify(x);
    return s.length > 600 ? s.slice(0, 600) + "…" : s;
  } catch {
    return String(x);
  }
}


