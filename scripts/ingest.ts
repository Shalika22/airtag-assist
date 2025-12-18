import fs from "node:fs/promises";
import path from "node:path";
import { loadEnv } from "@/scripts/load-env";
import { getConfig } from "@/lib/config";
import { chunkMarkdown } from "@/lib/rag/chunk";
import { CloudflareClient } from "@/lib/providers/cloudflare/client";
import { CloudflareEmbeddingsProvider } from "@/lib/providers/cloudflare/embeddings";
import { createSupabaseClient } from "@/lib/vectorstore/supabase";
import type { DocumentsInsert } from "@/lib/vectorstore/schema";

type DocMeta = {
  source: string;
  title: string;
  url: string | null;
  content: string;
};

async function main() {
  loadEnv();
  const cfg = getConfig();
  if (!cfg.supabase.serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for ingest.");
  }

  const kbDirAbs = path.join(process.cwd(), "data", "airtags");
  const files = (await fs.readdir(kbDirAbs)).filter((f) => f.endsWith(".md"));
  if (files.length === 0) throw new Error(`No markdown files found in ${kbDirAbs}`);

  const cfClient = new CloudflareClient({ accountId: cfg.cf.accountId, apiToken: cfg.cf.apiToken });
  const embeddings = new CloudflareEmbeddingsProvider(cfClient, cfg.cf.embedModel, cfg.rag.embedDim);
  const supabase = createSupabaseClient({ url: cfg.supabase.url, serviceRoleKey: cfg.supabase.serviceRoleKey }, "service");

  console.log(`Ingesting ${files.length} KB files from ${kbDirAbs} (EMBED_DIM=${cfg.rag.embedDim})...`);

  let inserted = 0;
  for (const file of files) {
    const abs = path.join(kbDirAbs, file);
    const raw = await fs.readFile(abs, "utf8");

    const meta: DocMeta = {
      source: `airtags/${file}`,
      title: extractTitle(raw) ?? file.replace(/\.md$/i, ""),
      url: extractFirstReferenceUrl(raw),
      content: raw
    };

    const chunks = chunkMarkdown(meta.content, { maxChars: 900, overlapChars: 120 });
    for (const ch of chunks) {
      const vec = await embeddings.embed(ch.content);
      const row: DocumentsInsert = {
        source: meta.source,
        title: meta.title,
        url: meta.url,
        chunk_id: ch.chunk_id,
        content: ch.content,
        embedding: vec
      };

      const { error } = await supabase.from("documents").upsert(row, { onConflict: "source,chunk_id" });
      if (error) {
        const hint =
          error.message.includes("no unique or exclusion constraint") || error.message.includes("ON CONFLICT")
            ? " (Hint: ensure the migration created a UNIQUE constraint on (source, chunk_id) in public.documents.)"
            : "";
        throw new Error(`Upsert failed for ${meta.source} chunk ${ch.chunk_id}: ${error.message}${hint}`);
      }
      inserted += 1;
      if (inserted % 10 === 0) console.log(`...upserted ${inserted} chunks`);
    }
  }

  console.log(`Done. Upserted ${inserted} chunks into public.documents.`);
}

function extractTitle(md: string): string | null {
  const m = md.match(/^#\s+(.+)\s*$/m);
  return m?.[1]?.trim() ?? null;
}

function extractFirstReferenceUrl(md: string): string | null {
  const m =
    md.match(/References:\s*\n(?:-|\*)\s*(https?:\/\/\S+)/i) ??
    md.match(/(https?:\/\/support\.apple\.com\/\S+)/i) ??
    md.match(/(https?:\/\/www\.apple\.com\/\S+)/i);
  return m?.[1] ?? null;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


