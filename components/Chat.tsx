"use client";

import { useMemo, useRef, useState } from "react";
import SourceChips from "@/components/SourceChips";
import type { ChatResponse, Source } from "@/lib/types";

type Msg = { role: "user" | "assistant"; content: string; sources?: Source[] };

const SUGGESTED: string[] = [
  "How do I set up an AirTag with my iPhone?",
  "How does Precision Finding work and what phones support it?",
  "Can I replace the AirTag battery and how often?",
  "Are AirTags waterproof or water-resistant?",
  "How does Lost Mode work?",
  "What privacy and anti-stalking features do AirTags have?"
];

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I can answer questions about Apple AirTags and Find My item tracking. Ask a question and I’ll cite the sources I used."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function send(q: string) {
    const question = q.trim();
    if (!question) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
        signal: abortRef.current.signal
      });

      const data = (await res.json()) as ChatResponse;
      if (!res.ok) {
        const errMsg = typeof data === "object" && data && "error" in data ? String((data as { error: unknown }).error) : "";
        throw new Error(errMsg || `Request failed (${res.status})`);
      }

      if (typeof data !== "object" || !data || !("answer" in data)) {
        throw new Error("Unexpected API response shape");
      }
      const ok = data as { answer: string; sources: Source[] };
      setMessages((m) => [...m, { role: "assistant", content: ok.answer, sources: ok.sources }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Sorry—something went wrong: ${msg}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      style={{
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "70vh",
        minHeight: 540
      }}
    >
      {/* Scrollable messages */}
      <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  maxWidth: "88%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: m.role === "user" ? "var(--bubble-user-bg)" : "var(--bubble-assistant-bg)",
                  color: m.role === "user" ? "rgba(255,255,255,0.95)" : "var(--text)",
                  border: "1px solid var(--bubble-border)",
                  lineHeight: 1.45,
                  whiteSpace: "pre-wrap"
                }}
              >
                <div style={{ fontSize: 14 }}>{m.content}</div>
                {m.role === "assistant" ? <SourceChips sources={m.sources ?? []} /> : null}
              </div>
            </div>
          ))}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "var(--bubble-assistant-bg)",
                  border: "1px solid var(--bubble-border)",
                  color: "var(--text)"
                }}
              >
                Thinking…
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Sticky composer + suggested questions */}
      <div style={{ borderTop: "1px solid var(--border)", background: "var(--panel)" }}>
        <div style={{ padding: 12 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Suggested questions</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => void send(s)}
                disabled={loading}
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--chip)",
                  padding: "8px 10px",
                  borderRadius: 999,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 12,
                  textAlign: "left",
                  color: "var(--text)"
                }}
                title="Send this question"
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about AirTags…"
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                outline: "none",
                background: "var(--input-bg)",
                color: "var(--text)"
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) void send(input);
                }
              }}
              disabled={loading}
            />
            <button
              onClick={() => void send(input)}
              disabled={!canSend}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: canSend ? "var(--accent)" : "var(--panel-strong)",
                color: canSend ? "rgba(255,255,255,0.95)" : "var(--text)",
                cursor: canSend ? "pointer" : "not-allowed"
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}


