"use client";

import type { Source } from "@/lib/types";

export default function SourceChips({ sources }: { sources: Source[] }) {
  if (!sources?.length) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
      {sources.map((s) => {
        const label = `${s.title}`;
        const chipStyle: React.CSSProperties = {
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 999,
          border: "1px solid var(--border)",
          background: "var(--chip)",
          fontSize: 12,
          color: "var(--text)",
          textDecoration: "none"
        };

        return s.url ? (
          <a key={`${s.title}:${s.chunk_id}`} href={s.url} target="_blank" rel="noreferrer" style={chipStyle} title={s.url}>
            <span>{label}</span>
            <span style={{ color: "var(--muted2)" }}>{Math.max(0, s.score).toFixed(2)}</span>
          </a>
        ) : (
          <span key={`${s.title}:${s.chunk_id}`} style={chipStyle} title="No URL available for this source">
            <span>{label}</span>
            <span style={{ color: "var(--muted2)" }}>{Math.max(0, s.score).toFixed(2)}</span>
          </span>
        );
      })}
    </div>
  );
}


