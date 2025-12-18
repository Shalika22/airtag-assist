import type { ChatProvider, RagPipeline, Retriever, Source } from "@/lib/types";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/rag/prompt";
import { buildSmallTalkReply, classifySmallTalk, enforceGuardrails } from "@/lib/rag/guardrails";
import { OutOfScopeError, SafetyRefusalError } from "@/lib/errors";

export class DefaultRagPipeline implements RagPipeline {
  constructor(private readonly deps: { retriever: Retriever; chat: ChatProvider }) {}

  async run(question: string): Promise<{ answer: string; sources: Source[] }> {
    const smallTalk = classifySmallTalk(question);
    if (smallTalk) {
      return { answer: buildSmallTalkReply(smallTalk.kind), sources: [] };
    }

    try {
      enforceGuardrails(question);
    } catch (e) {
      if (e instanceof OutOfScopeError || e instanceof SafetyRefusalError) {
        return { answer: e.message, sources: [] };
      }
      throw e;
    }

    const chunks = await this.deps.retriever.retrieve(question);
    if (!chunks.length) {
      return {
        answer:
          "I’m not finding any relevant AirTag info in the current knowledge base. Try rephrasing, or check Apple Support for the latest details.\n\nSources:\n- (no sources found)",
        sources: []
      };
    }

    const messages = [
      { role: "system" as const, content: buildSystemPrompt() },
      { role: "user" as const, content: buildUserPrompt(question, chunks) }
    ];

    const answer = await this.deps.chat.generate({ messages, temperature: 0.2, maxTokens: 700 });

    // UI/API sources are derived from retrieval output; the model is still forced to include a "Sources:" section too.
    const sources: Source[] = chunks.map((c) => ({
      title: c.title,
      url: c.url,
      chunk_id: c.chunk_id,
      score: c.similarity
    }));

    return { answer, sources };
  }
}
