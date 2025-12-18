import { NextResponse } from "next/server";
import path from "node:path";
import { getConfig } from "@/lib/config";
import { BadRequestError } from "@/lib/errors";
import type { ChatResponse } from "@/lib/types";
import { CloudflareClient } from "@/lib/providers/cloudflare/client";
import { CloudflareChatProvider } from "@/lib/providers/cloudflare/chat";
import { CloudflareEmbeddingsProvider } from "@/lib/providers/cloudflare/embeddings";
import { createSupabaseClient } from "@/lib/vectorstore/supabase";
import { RagRetriever } from "@/lib/rag/retriever";
import { DefaultRagPipeline } from "@/lib/rag/pipeline";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { question?: unknown };
    const question = typeof body?.question === "string" ? body.question.trim() : "";
    if (!question) throw new BadRequestError("Missing 'question' string in request body.");

    const cfg = getConfig();

    const cfClient = new CloudflareClient({ accountId: cfg.cf.accountId, apiToken: cfg.cf.apiToken });
    const embeddings = new CloudflareEmbeddingsProvider(cfClient, cfg.cf.embedModel, cfg.rag.embedDim);
    const chat = new CloudflareChatProvider(cfClient, cfg.cf.chatModel);

    const supabase = createSupabaseClient({ url: cfg.supabase.url, anonKey: cfg.supabase.anonKey }, "anon");
    const retriever = new RagRetriever(
      { topK: cfg.rag.topK, minScore: cfg.rag.minScore, kbDirAbs: path.join(process.cwd(), "data", "airtags") },
      { embeddings, supabase }
    );
    const pipeline = new DefaultRagPipeline({ retriever, chat });

    const result = await pipeline.run(question);
    const resp: ChatResponse = { answer: result.answer, sources: result.sources };
    return NextResponse.json(resp, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const resp: ChatResponse = { error: msg };
    return NextResponse.json(resp, { status: 500 });
  }
}


