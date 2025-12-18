import { loadEnv } from "@/scripts/load-env";
import { getConfig } from "@/lib/config";
import { createSupabaseClient, matchDocuments } from "@/lib/vectorstore/supabase";

async function main() {
  loadEnv();
  const cfg = getConfig();
  if (!cfg.supabase.anonKey) throw new Error("SUPABASE_ANON_KEY is required for runtime read/smoke.");

  const supabase = createSupabaseClient({ url: cfg.supabase.url, anonKey: cfg.supabase.anonKey }, "anon");

  console.log("Checking Supabase connectivity...");
  const { data, error } = await supabase.from("documents").select("id").limit(1);
  if (error) throw new Error(`Supabase SELECT failed: ${error.message}`);
  console.log(`OK: documents table reachable (sample rows returned: ${data?.length ?? 0})`);

  console.log("Checking RPC match_documents exists...");
  const zeroVec = Array.from({ length: cfg.rag.embedDim }, () => 0);
  await matchDocuments({ client: supabase, queryEmbedding: zeroVec, matchCount: 1, minScore: 0 });
  console.log("OK: RPC match_documents callable");

  console.log("Smoke test passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


