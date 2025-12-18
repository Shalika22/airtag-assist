export type MatchDocumentsRow = {
  id: string;
  title: string;
  url: string | null;
  chunk_id: number;
  content: string;
  similarity: number;
};

export type DocumentsInsert = {
  source: string;
  title: string;
  url?: string | null;
  chunk_id: number;
  content: string;
  embedding: number[];
};


