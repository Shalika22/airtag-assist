import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { MatchDocumentsRow } from "@/lib/vectorstore/schema";

export type SupabaseVectorStoreConfig = {
  url: string;
  anonKey?: string;
  serviceRoleKey?: string;
};

export function createSupabaseClient(cfg: SupabaseVectorStoreConfig, role: "anon" | "service"): SupabaseClient {
  const key = role === "service" ? cfg.serviceRoleKey : cfg.anonKey;
  if (!key) throw new Error(`Missing Supabase key for role=${role}. Set SUPABASE_${role === "service" ? "SERVICE_ROLE_KEY" : "ANON_KEY"}.`);
  return createClient(cfg.url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function matchDocuments(params: {
  client: SupabaseClient;
  queryEmbedding: number[];
  matchCount: number;
  minScore: number;
}): Promise<MatchDocumentsRow[]> {
  const { data, error } = await params.client.rpc("match_documents", {
    query_embedding: params.queryEmbedding,
    match_count: params.matchCount,
    min_score: params.minScore
  });

  if (error) throw new Error(`Supabase RPC match_documents failed: ${error.message}`);
  return (data ?? []) as MatchDocumentsRow[];
}


