export type Source = {
  title: string;
  url?: string | null;
  chunk_id: number;
  score: number;
};

export type ChatResponse =
  | { answer: string; sources: Source[] }
  | { error: string; answer?: string; sources?: Source[] };

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface EmbeddingsProvider {
  embed(input: string): Promise<number[]>;
}

export interface ChatProvider {
  generate(opts: { messages: ChatMessage[]; temperature?: number; maxTokens?: number }): Promise<string>;
}

export type RetrievedChunk = {
  id: string;
  title: string;
  url: string | null;
  chunk_id: number;
  content: string;
  similarity: number;
  source?: "vector" | "lexical";
};

export interface Retriever {
  retrieve(query: string): Promise<RetrievedChunk[]>;
}

export interface RagPipeline {
  run(question: string): Promise<{ answer: string; sources: Source[] }>;
}


