import { zEnvInt, zEnvNum, zEnvStr, zEnvUrl } from "@/lib/utils/text";

export type AppConfig = {
  cf: {
    accountId: string;
    apiToken: string;
    chatModel: string;
    embedModel: string;
  };
  supabase: {
    url: string;
    anonKey?: string;
    serviceRoleKey?: string;
  };
  rag: {
    topK: number;
    minScore: number;
    embedDim: number;
  };
  runtime: {
    nodeEnv: string;
  };
};

export function getConfig(): AppConfig {
  const cfAccountId = zEnvStr("CF_ACCOUNT_ID");
  const cfApiToken = zEnvStr("CF_API_TOKEN");
  const cfChatModel = process.env.CF_CHAT_MODEL?.trim() || "@cf/meta/llama-3.1-8b-instruct";
  const cfEmbedModel = process.env.CF_EMBED_MODEL?.trim() || "@cf/baai/bge-small-en-v1.5";

  const supabaseUrl = zEnvUrl("SUPABASE_URL");
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const topK = zEnvInt("RAG_TOP_K", 5);
  const minScore = zEnvNum("RAG_MIN_SCORE", 0.2);
  const embedDim = zEnvInt("EMBED_DIM", 384);

  return {
    cf: { accountId: cfAccountId, apiToken: cfApiToken, chatModel: cfChatModel, embedModel: cfEmbedModel },
    supabase: { url: supabaseUrl, anonKey: supabaseAnonKey, serviceRoleKey: supabaseServiceRoleKey },
    rag: { topK, minScore, embedDim },
    runtime: { nodeEnv: process.env.NODE_ENV || "development" }
  };
}


