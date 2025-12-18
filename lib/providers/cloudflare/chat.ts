import type { ChatMessage, ChatProvider } from "@/lib/types";
import { CloudflareClient } from "@/lib/providers/cloudflare/client";

type CfChatResult = {
  response?: string;
  // Some models can return structured output; we keep this minimal for forward-compat.
};

export class CloudflareChatProvider implements ChatProvider {
  constructor(private readonly client: CloudflareClient, private readonly model: string) {}

  async generate(opts: { messages: ChatMessage[]; temperature?: number; maxTokens?: number }): Promise<string> {
    const result = await this.client.run<CfChatResult>(this.model, {
      messages: opts.messages,
      temperature: opts.temperature ?? 0.2,
      max_tokens: opts.maxTokens ?? 512
    });
    const text = result?.response?.trim();
    if (!text) throw new Error("Chat response missing text");
    return text;
  }
}


